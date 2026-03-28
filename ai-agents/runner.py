import os
import re
import time
from pathlib import Path
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

TASK_FILE = "ai-agents/coordination/tasks.md"

def read_file(path):
    with open(path) as f:
        return f.read()

def write_file(path, content):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path,"w") as f:
        f.write(content)

def next_task():
    tasks = read_file(TASK_FILE).splitlines()
    for t in tasks:
        if "[ ]" in t:
            return t.replace("[ ]","").strip()
    return None

def mark_done(task):
    data = read_file(TASK_FILE)
    data = data.replace("[ ] "+task,"[x] "+task)
    write_file(TASK_FILE,data)

def run_agent(prompt_file, instruction):

    role = read_file(prompt_file)

    msg = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=4000,
        messages=[
            {
                "role":"user",
                "content": role + "\n\nTASK:\n"+instruction
            }
        ]
    )

    return msg.content[0].text


def apply_file_changes(response):

    files = re.findall(r'FILE:(.*?)CONTENT:(.*?)(?=FILE:|$)',response,re.S)

    for path,content in files:
        path = path.strip()
        content = content.strip()
        write_file(path,content)
        print("Updated:",path)


print("Autonomous agents started")

while True:

    task = next_task()

    if not task:
        print("All tasks complete")
        break

    print("Current Task:",task)

    research = run_agent("ai-agents/agents/research.txt",task)

    plan = run_agent("ai-agents/agents/planner.txt",research)

    build = run_agent("ai-agents/agents/builder.txt",plan)

    apply_file_changes(build)

    review = run_agent("ai-agents/agents/reviewer.txt",task)

    print("Review:",review[:200])

    mark_done(task)

    time.sleep(2)

print("Finished")
