import re
p = open("create_issues.py","r",encoding="utf-8").read()
new_fn = '''def run(args, input_data=None, timeout=60):
    try:
        if input_data is not None:
            r = subprocess.run(args, input=input_data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", timeout=timeout)
        else:
            r = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired as e:
        return 124, "", f"timeout: {e}"
'''
p2 = re.sub(r"def run\(args.*?return 124,.*?\n", new_fn, p, count=1, flags=re.DOTALL)
open("create_issues.py","w",encoding="utf-8").write(p2)
print("ok")
