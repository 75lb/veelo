#!/usr/bin/env sh

rm -rf fixture
mkdir -p fixture/sub/sub2

shopt -s dotglob
cp -vp assets/* fixture
cp -vp assets/* fixture/sub
cp -vp assets/* fixture/sub/sub2
