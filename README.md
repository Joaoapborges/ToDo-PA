# TaskManager — Electron + SQLite

🎬 [Ver demonstração no YouTube](https://youtu.be/V2R7w6GffoM)

Aplicação desktop desenvolvida como projeto pessoal para gerir tarefas do dia-a-dia, com armazenamento local em SQLite e um widget flutuante sempre visível no ecrã.

> UI com navegação lateral, filtro por data e suporte a tema Light/Dark.

## Tecnologias

- **Electron** (main/renderer)
- **SQLite** (`sqlite3`)
- **IPC seguro** via `preload.js`

## Funcionalidades

- Widget flutuante (pin/close) com as tarefas do dia, sempre acessível
- Adicionar / editar / apagar tarefas (com modais e confirmação)
- Marcar concluída (checkbox)
- Filtro por **data** (slider semanal + navegação dia-a-dia)
- Expandir notas
- Tema **Light/Dark**

## Como executar

```bash
npm install
npm start
```

## Roadmap

- Editar **nome** e **fotografia de perfil** nas **Settings**
- Fazer o **widget** receber o **tema escuro** da app
- Ajustar **cores** do **tema escuro** (no widget)
- Integrar tarefas do **Google Calendar**

## Segurança (Electron)

- `nodeIntegration: false`
- `contextIsolation: true`
- Acesso a dados no renderer via **IPC** (preload)
