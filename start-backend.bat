@echo off
echo Starting GroceryPick Backend...
cd /d "%~dp0backend"
set DJANGO_DEBUG=True
py -3 manage.py runserver 127.0.0.1:8000
