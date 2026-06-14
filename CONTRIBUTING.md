## Quick Start

> Before you begin, ensure you have Node.js (version 20.0 or higher) and npm installed on your system. You can verify this by running the following commands in your terminal:

```
npm install -g @monostudio/msce
```

## To continue existing project

```
msce init
```

## To create a new ms-ext template 

```
msce
```

## Post Generation Workflow

Once the CLI finishes generating your files, it will output a success message along with the commands needed to start developing.

```
✔ Created my-extension/

  cd my-extension
  npm install

  npm run build       # compile once
  npm run watch       # compile + watch
  npm run package     # validate + bundle → release/*.msxt
```
