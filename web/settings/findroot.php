<?php

// Show all errors
error_reporting(E_ALL & ~E_NOTICE);
ini_set("display_errors", 1);

    $directory = __DIR__;
    echo $directory;
    echo '<br>';
    echo dirname($directory);
    echo '<br>';
    echo $_SERVER['DOCUMENT_ROOT'];
    echo '<br>';

    echo $x;
    echo 'yup';
?>