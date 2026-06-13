# TodoBackup (Electron + SQLite)

Aplicação desktop (Electron) para gerir tarefas (CRUD) e guardá-las em SQLite.

> UI com navegação lateral, tarefas com filtro por data e suporte a tema (Light/Dark).

## Tecnologias
- **Electron** (main/renderer)
- **SQLite** (`sqlite3`)
- **IPC seguro** via `preload.js`

## Funcionalidades
- Adicionar / editar / apagar tarefas (com modais e confirmação)
- Marcar concluída (checkbox)
- Filtro por **data** (slider semanal + navegação dia-a-dia)
- Expandir notas
- Tema **Light/Dark**
- Widget flutuante (pin/close) para tarefas do dia

## Como executar
```bash
npm install
npm start
```

## Próximos objetivos
- Editar **nome** e **fotografia de perfil** nas **Settings**
- Fazer o **widget** receber o **tema escuro** da app
- Ajustar **cores** do **tema escuro** (no widget)
- Integrar tarefas do **Google calendar**

## Segurança (Electron)

- `nodeIntegration: false`
- `contextIsolation: true`
- acesso a dados no renderer via **IPC** (preload)


