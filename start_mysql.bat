@echo off
echo ===================================================
echo Memulai MariaDB / MySQL Server untuk SIOMAS...
echo Port: 3306
echo Tekan Ctrl+C untuk menghentikan.
echo ===================================================
"C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\data_clean\my.ini" --basedir="C:\xampp\mysql" --datadir="C:\xampp\data_clean" --tmpdir="C:\xampp\tmp" --console
