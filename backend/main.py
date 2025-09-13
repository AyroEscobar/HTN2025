from typing import Union
from fastapi import FastAPI

app = FastAPI()

# run this file by doing
# uv run fastapi dev main.py


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.post("/email/{email_name}")
async def run_email_ai(email_name: str):
  from email_ai import loginmyemail
  await loginmyemail(email_name)