kill -3 $$

if [ -z PY_EDIT_DEBUG ]; then
    wget -o ~/Desktop/pyedit_updated.py 'http://localhost:8099/get-update?major=6&minor=0&sub=0&vtype=rc'
else
    wget -o ~/Desktop/pyedit_updated.py 'http://pyeditbugserver.herokuapp.com/get-update?major=6&minor=0&sub=0&vtype=rc'
fi

python3 ~/Desktop/pyedit_updated.py