#!/bin/zsh
# Recorta las franjas negras de las capturas y guarda JPG
O=~/Automotriz-Lomeli/catalogo; mkdir -p $O/fotos
for f in $O/raw/*.png; do
  b=$(basename $f .png)
  crop=$(~/.local/bin/ffmpeg -hide_banner -i "$f" -vf "cropdetect=24:2:0" -frames:v 1 -f null - 2>&1 | grep -o 'crop=[0-9:]*' | tail -1)
  ~/.local/bin/ffmpeg -y -hide_banner -loglevel error -i "$f" -vf "$crop" -q:v 3 "$O/fotos/$b.jpg"
done
ls -la $O/fotos
