# TodoBackup (Electron + SQLite)

Projeto Electron para gerir uma lista de tarefas (CRUD) guardada numa base de dados SQLite.

## Tecnologias

- Electron (main/renderer)
- SQLite (`sqlite3`)
- IPC seguro via `preload.js` (`contextBridge` + `ipcMain.handle`)

## Estrutura do Projeto

### `src/main/main.js`

Responsável por:

- Criar a janela do Electron
- Inicializar a base de dados SQLite
- Registar os handlers IPC:
  - `db:getItems`
  - `db:saveItem`
  - `db:deleteItem`

### `src/preload/preload.js`

Exponibiliza no frontend a API:

```javascript
window.todoAPI = {
  getItems(),
  saveItem(item),
  deleteItem(id)
};
```

### `src/database/database.js`

Responsável por:

- Abrir/criar a base de dados
- Criar a tabela `TodoItem`
- Implementar os métodos:
  - `InitDatabase()`
  - `GetItemsAsync()`
  - `SaveItemAsync(item)` (UPDATE ou INSERT)
  - `DeleteItemAsync(id)`

### `src/renderer/index.html`

Interface gráfica:

- Lista de tarefas
- Modal para adicionar/editar tarefas
- Modal de confirmação para apagar tarefas

### `src/renderer/renderer.js`

Contém a lógica do frontend:

- Carregamento dos dados
- Renderização da lista
- Gestão de eventos
- Operações CRUD

### `src/renderer/style.css`

Responsável pelos estilos:

- Layout da aplicação
- Botões
- Modais

## Funcionalidades

### Adicionar e Editar tarefa

- Através de modal dedicado

### Concluir / Desconcluir tarefa

- Utilização de checkbox na lista
- O campo `Done` é guardado como `0` ou `1` no SQLite
- `CompletedAt` é definido quando a tarefa é concluída
- `CompletedAt` é limpo quando a tarefa é desconcluída

### Apagar tarefa

- Modal de confirmação antes da remoção

### Data Limite de conclusão (`DueDate`)

- Campo opcional
- Apresentado na lista quando definido

## Base de Dados (SQLite)

### Tabela: `TodoItem`

| Campo | Tipo | Descrição |
|---------|---------|---------|
| ID | INTEGER PRIMARY KEY AUTOINCREMENT | Identificador único |
| Name | TEXT NOT NULL | Nome da tarefa |
| Notes | TEXT | Notas adicionais |
| Done | INTEGER DEFAULT 0 | Estado da tarefa |
| CreatedAt | DATETIME DEFAULT CURRENT_TIMESTAMP | Data de criação |
| DueDate | DATETIME | Data limite |
| CompletedAt | DATETIME | Data de conclusão |

## Como Executar

### Instalar dependências

```bash
npm install
```

### Iniciar a aplicação

```bash
npm start
```

## Scripts (`package.json`)

```json
{
  "start": "electron ."
}
```

## Nota de Segurança

A aplicação segue boas práticas de segurança no Electron:

- `nodeIntegration: false`
- `contextIsolation: true`
- Comunicação entre frontend e backend apenas via IPC

Isto evita o acesso direto às APIs do Node.js a partir do renderer, reduzindo riscos de segurança.