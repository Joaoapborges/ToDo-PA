# TodoBackup (Electron + SQLite)

Aplicação **desktop** (Electron) para gerir tarefas (**CRUD**) e guardá-las em **SQLite**.

> UI inclui navegação lateral, página de tarefas com **filtro por semana/dia**, modais para adicionar/editar e confirmação ao apagar, além de **tema (Light/Dark)**.

## Tecnologias
- **Electron** (main/renderer)
- **SQLite** (`sqlite3`)
- **IPC seguro** via `preload.js` (`contextBridge` + `ipcMain.handle`)

## Arquitetura (backend)
### `src/main/main.js`
- Cria a janela do Electron
- Inicializa a base de dados
- Regista handlers IPC:
  - `db:getItems`
  - `db:saveItem`
  - `db:deleteItem`

### `src/preload/preload.js`
Expõe no renderer:
```js
window.todoAPI = {
  getItems: () => ipcRenderer.invoke('db:getItems'),
  saveItem: (item) => ipcRenderer.invoke('db:saveItem', item),
  deleteItem: (id) => ipcRenderer.invoke('db:deleteItem', id)
};
```

### `src/database/database.js`
- DB em: `app.getPath('userData')/todo.db`
- Cria tabela `TodoItem` (se não existir)
- Implementa:
  - `InitDatabase()`
  - `GetItemsAsync()`
  - `SaveItemAsync(item)` (faz `INSERT` ou `UPDATE`)
  - `DeleteItemAsync(id)`

## Interface (frontend)
### `src/renderer/index.html`
- Layout com **sidebar** e páginas:
  - `Tarefas` (`#tarefas-page`)
  - `Calendário` (`#calendario-page`) 
  - `Settings` (`#settings-page`)
- Página **Tarefas** inclui:
  - header com botão **+ Nova Tarefa**
  - **slider semanal** (7 dias) + botão **Voltar ao dia de Hoje**
  - lista `#task-list`
- Modais:
  - `#task-modal` (Adicionar/Editar)
  - `#confirm-modal` (confirmar apagar)

### `src/renderer/js/renderer.js`
- Carrega tarefas via `window.todoAPI.getItems()`
- Renderiza a lista
- Implementa o CRUD via `saveItem` e `deleteItem`
- **Filtro por data selecionada no calendário**:
  - mostra tarefas cujo `DueDate` bate com a data ativa
- Permite:
  - marcar/desmarcar concluída (checkbox)
  - expandir/colapsar a descrição (notas)
  - editar a tarefa (preenche o modal)
  - apagar (modal de confirmação)

### `src/renderer/js/calendar.js`
- Renderiza a semana em `#week-slider`
- Mantém `selectedDate` / `currentWeekStart`
- Dispara evento:
  - `window.dispatchEvent(new CustomEvent('dateSelected', { detail: { date } }))`

### `src/renderer/js/theme.js`
- Tema guardado em `localStorage` (`light`/`dark`)
- Alterna `data-theme` no `documentElement`

### `src/renderer/js/navigation.js`
- Navegação entre páginas na sidebar (toggle `.active`)

## Modelo de dados (SQLite)
Tabela: `TodoItem`

| Campo | Tipo | Descrição |
|---|---|---|
| `ID` | INTEGER (PK AUTOINCREMENT) | identificador |
| `Name` | TEXT NOT NULL | título da tarefa |
| `Notes` | TEXT | descrição/linhas adicionais |
| `Done` | INTEGER DEFAULT 0 | concluída (0/1) |
| `CreatedAt` | DATETIME DEFAULT CURRENT_TIMESTAMP | criação |
| `DueDate` | DATETIME | data limite (opcional) |
| `CompletedAt` | DATETIME | quando foi concluída (opcional) |

### Como o “Done” é tratado
- No renderer, `Done` é usado como **boolean** (`true/false`)
- No SQLite é guardado como **0/1**

## Funcionalidades principais (conforme a app atual)
- **Adicionar tarefa** (modal)
- **Editar tarefa** (modal)
- **Concluir/Desconcluir** via checkbox na lista
- **Filtro de tarefas por data selecionada** (slider semanal)
- **Expandir notas** (descrição)
- **Apagar com confirmação**
- **Tema Light/Dark**
- **Navegação lateral** entre Tarefas / Calendário / Settings

## Como executar
```bash
npm install
npm start
```

## Scripts (`package.json`)
- `start`: `electron .`

## Nota de segurança (Electron)
- `nodeIntegration: false`
- `contextIsolation: true`
- renderer não acessa Node diretamente; tudo passa por IPC (via preload)

