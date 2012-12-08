#!/usr/bin/env sh

rm -rf fixture
mkdir -p fixture/sub/sub2

shopt -s dotglob
cp -v assets/* fixture
cp -v assets/* fixture/sub
cp -v assets/* fixture/sub/sub2
