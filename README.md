# Number-Waterfall-Game

To start websocket-server with venv:
- python -m venv venv
- source venv/bin/active
- pip install -r requirements.txt
- python src/main.py

Run game-interface and teacher-interface: `npm install` and `npm run dev`.


## Setup

### Dependencies

Create a virtual environment and install python dependencies. (Tested on python 3.12)

New venv
```bash
py -3.12 -m venv .venv
```

Activate venv
```bash
# Linux
source .venv/bin/activate

# Windows
.\.venv\Scripts\activate
```

Verify installation
```bash
# Linux
which python # should include .venv

# Windows
where python # first entry should include .venv
```

Install dependencies
```bash
pip install -r requirements.txt
```


### Frontend
Run the following commands in both `teacher-interface` and `game-interface`

```bash
# Install modules
npm install

# Build static files
npm run build
```

### Running
Run the project

```bash
# Make sure venv is activated

python src/main.py
```

To run the wizard of oz helper use
```bash
python wizard-of-oz/main.py
```

