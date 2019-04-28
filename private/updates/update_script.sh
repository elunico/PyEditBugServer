pypid=$(ps -ax | grep 'pyedit' | cut -f1 -d' ')
echo "Stopping PyEdit $pypid"
kill -3 $pypid


echo -n "My pid is: "
ps -ax | grep "update_script" | cut -f1 -d" "

# if [ -z PY_EDIT_DEBUG ]; then
curl -o ~/Desktop/pyedit_updated.py 'http://localhost:8099/get-update?major=6&minor=0&sub=0&vtype=rc'
# else
# curl -o ~/Desktop/pyedit_updated.py 'http://pyeditbugserver.herokuapp.com/get-update?major=6&minor=0&sub=0&vtype=rc'
# fi

python3 ~/Desktop/pyedit_updated.py