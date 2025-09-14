from agent import ComputerAgent
from computer import Computer, VMProviderType
import asyncio
import webbrowser
import logging

import dotenv
dotenv.load_dotenv('/Users/ayroescobar/cua/notebooks/.env')

async def loginmyemail(email_address):
  # creates a linux VM
  computer = Computer(
    provider_type=VMProviderType.DOCKER,
    os_type="linux"
  )
  await computer.run()

  # open VM's VNC in web browser
  webbrowser.open("http://localhost:8006/", new=0, autoraise=True)


  agent = ComputerAgent(
      model="anthropic/claude-sonnet-4-20250514",
      tools=[computer],
      verbosity=logging.INFO,
      only_n_most_recent_images=2
  )

  prompt = f"Go to interview-lens.com and sign up for the waitlist at the bottom of the website please {email_address}"
  print("User: ", prompt)

  async for result in agent.run(prompt):
      if result["output"] and result["output"][-1]["type"] == "message":
          print("Agent:", result["output"][-1]["content"][0]["text"])

  await computer.stop()

#Thus only gets runned if you direclty call the file
if __name__ == "__main__":
  import sys
  email = sys.argv[1]
  asyncio.run(loginmyemail(email))