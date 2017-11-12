<?php

class simon {

    private $assets;
    private $config;
    private $hasCompiled = false;
    private $origNamespace = 'SIMON';

    function __construct($config = [], $base = false, $configfile = false) {
        $this->dir = dirname(__FILE__) . '/../../';
        $this->base = $base ? $base : $this->dir;

        $defaults = $this->readConfig($this->dir . '.build/defaults');
        if (!count($defaults)) {
            throw new error('Default settings not found');
        }
        foreach ($defaults as $default => $set) {
            $this->$default = $set;
        }

        $a = $this->readConfig($this->base . ($configfile ? $configfile : '.config'));

        $config = array_replace_recursive($a, $config);

        $this->config = array_replace_recursive($this->config, $config);

        if ($this->config['libraries']) {
            $this->assets = array_merge(
                    array_map(function($a) {
                        return 'libraries/' . $a;
                    }, $this->config['libraries']), $this->assets
            );
        }

        if ($this->config['modules']) {
            foreach ($this->config['modules'] as $module) {
                $this->assets[] = 'modules/' . $module . '/' . $module;
                $conf = $this->readConfig('modules/' . $module . '/.info');
                if (isset($conf['requires'])) {
                    foreach ($conf['requires'] as $req) {
                        $parts = explode('/', $req);
                        if ($parts[0] == 'modules') {
                            $parts[] = $parts[count($parts) - 1];
                            $req = implode('/', $parts);
                        }
                        if (!in_array($req, $this->assets)) {
                            throw new error("Module '$module' requires asset '$req' to be inserted prior to itself");
                        }
                    }
                }
            }
        }
        $this->config['js_defs_print'] = 'const ' . $this->origNamespace . '={s:' . ($this->config['js_defs'] ? json_encode($this->config['js_defs']) : '{}') . '};';
    }

    private function readConfig($file) {
        $config = [];
        if (file_exists($file . '.json')) {
            $config = json_decode(file_get_contents($file . '.json'), true);
            if (!$config || !is_array($config)) {
                throw new error($file . '.json badly formatted');
            }
        }
        return $config;
    }

    function compile($set = []) {
        $this->hasCompiled = true;
        foreach ($set as $k => $v) {
            $this->config['compile'][$k] = $v;
        }
        $code = [];
        foreach ($this->assets as $asset) {
            $f = $asset . $this->config['file_extension'];
            $file = $this->dir . $f;
            if (!file_exists($file)) {
                throw new Exception('Asset "' . $f . '" does not exist', 2510);
            }

            $code[$asset] = file_get_contents($file);
        }

        if ($this->config['compile']['aggregate']) {
            $code = [$this->config['compile']['aggregate_file'] => '"use strict";' . $this->config['js_defs_print'] . implode('', $code)];
        } else {
            $code = array_map(function($c) {
                return '"use strict";' . $c;
            }, $code);
        }


        $replacements = [];
        if ($this->config['namespace']) {
            $replacements[] = [$this->origNamespace, $this->config['namespace']];
        }


        if (count($replacements)) {
            $replacements = array_map(null, ...$replacements);
            $code = array_map(function($c) use ($replacements) {
                return str_replace($replacements[0], $replacements[1], $c);
            }, $code);

            $this->config['js_defs_print'] = str_replace($replacements[0], $replacements[1], $this->config['js_defs_print']);
        }


        if (!file_exists($this->base . $this->config['compile']['to'])) {
            if (!mkdir($this->base . $this->config['compile']['to'])) {
                throw new Exception('Unable to create compile directory ' . $this->config['compile']['to']);
            }
        }

        function removeRecur($path) {
            $files = glob(preg_replace('/(\*|\?|\[)/', '[$1]', $path) . '/{,.}*', GLOB_BRACE);
            foreach ($files as $file) {
                if ($file == $path . '/.' || $file == $path . '/..') {
                    continue;
                }
                if (is_dir($file)) {
                    removeRecur($file);
                    rmdir($file);
                } else {
                    unlink($file);
                }
            }
        }

        removeRecur($this->base . $this->config['compile']['to']);
        if ($this->config['compile']['minify']) {
            require_once(dirname(__FILE__) . '/lib/minify.php');
        }
        foreach ($code as $file => $cont) {
            $parts = explode('/', $file);
            if (count($parts) > 1) {
                array_pop($parts);
                $dir = implode('/', $parts);
                if (!file_exists($this->base . $this->config['compile']['to'] . '/' . $dir)) {
                    if (!mkdir($this->base . $this->config['compile']['to'] . '/' . $dir, 0777, true)) {
                        throw new Exception('Unable to create compile subdirectory ' . $this->config['compile']['to'] . '/' . $dir);
                    }
                }
            }
            $saveto = $this->base . $this->config['compile']['to'] . "/" . $file . $this->config['file_extension'];
            if (!file_put_contents($saveto, $cont)) {
                throw new Exception('Unable to write file ' . $this->config['compile']['to'] . "/" . $file . $this->config['file_extension']);
            }
            if ($this->config['compile']['transpileES6']) {
                exec("cd " . dirname(__FILE__) . "/.. && babel " . ($this->config['compile']['minify'] ? /* TODO er is nog flag --minify in babel maar dat brak eerst de js */'' : '') . " --presets es2015 --out-file $saveto < $saveto");
                //fix babel bug (https://stackoverflow.com/questions/34973442/how-to-stop-babel-from-transpiling-this-to-undefined)
                file_put_contents($saveto, str_replace('(undefined)', '(this)', file_get_contents($saveto)));
            }
            if ($this->config['compile']['minify']) {
                $packer = new GK\JavascriptPacker(file_get_contents($saveto), $this->config['compile']['minify_encoding'], $this->config['compile']['minify_fastDecode'], $this->config['compile']['minify_specialChars']);
                $pack = $packer->pack();
                if ($this->config['namespace']) {
                    //fix minify error
                    $fix = [
                        ['const' . $this->config['namespace'], 'const ' . $this->config['namespace']],
                        ['extends' . $this->config['namespace'], 'extends ' . $this->config['namespace']],
                        ['new' . $this->config['namespace'], 'new ' . $this->config['namespace']],
                        ['var' . $this->config['namespace'], 'var ' . $this->config['namespace']],
                        ['let' . $this->config['namespace'], 'let ' . $this->config['namespace']],
                    ];
                    $fix = array_map(null, ...$fix);
                    $pack = str_replace($fix[0], $fix[1], $pack);
                }
                file_put_contents($saveto, $pack);
            }
        }
    }

    function html($compiled = false, $printdirect = false) {
        $ret = '';
        if ($this->config['js_defs_print'] && (!$this->hasCompiled || !$this->config['compile']['aggregate'])) {
            $ret .= '<script>' . $this->config['js_defs_print'] . '</script>';
        }

        $tomap = $compiled && $this->config['compile']['aggregate'] ? [$this->config['compile']['aggregate_file']] : $this->assets;
        if ($printdirect) {
            $ret .= implode('', array_map(function($asset) {
                        return '<script>' . file_get_contents($this->base . $this->config['compile']['to'] . "/" . $asset . $this->config['file_extension']) . '</script>';
                    }, $tomap));
        } else {
            $ext = $this->config['file_extension'] . ($this->config['bust_cache'] ? (isset($this->config['cache_buster']) && $this->config['cache_buster'] ? $this->config['cache_buster'] : '?' . substr(str_shuffle(str_repeat($x = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($this->config['bust_cache'] / strlen($x)))), 1, $this->config['bust_cache'])) : '');
            $path = $this->config[$compiled ? 'compiled_url_path' : 'original_url_path'];

            $sources = array_map(function($asset) use ($ext, $path) {
                return $path . $asset . $ext;
            }, $tomap);

            foreach ($sources as $source) {
                $ret .= str_replace('{{src}}', $source, $this->config['tag']);
            }
        }
        return $ret;
    }

}
