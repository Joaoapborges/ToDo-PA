const sqlite3 = require('sqlite3').verbose(); //verbose ativa  mensagens de debug mais detalhadas
const path = require('path'); // modulo para ajudar a criar caminho de ficheiros dependendo do SO
const {app} = require('electron');

const dbPath = path.join(app.getPath('userData'), 'todo.db');

let db; // irá ser usada mais tarde para abrir a DB

// iniciar DB e criar tabela TodoItem

function InitDatabase(){
    return new Promise((resolve, reject) =>{
        //abrir a ligação
        db = new sqlite3.Database(dbPath, (err) => {
            if (err){
                console.error('Erro ao ligar á DB', err);
                reject(err);
                return;
            }
            console.log('Ligação á DB em :', dbPath);

            // O SQLite não tem BOOLEAN real entao usar INTEGER (0 = false, 1 = true)

            const createTableQuery=`
            CREATE TABLE IF NOT EXISTS TodoItem (
                ID INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL,
                Notes TEXT,

                Done INTEGER DEFAULT 0,

                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                DueDate DATETIME,
                CompletedAt DATETIME,
                SortOrder INTEGER DEFAULT 0
            )
            `;
            
            // abrir a ligação
            db.run(createTableQuery, (err) => {
                if (err) reject(err);
                else resolve();
        });
    });
});
}

// Atualizar a ordem de vários itens de uma vez
function UpdateItemsOrderAsync(orderedIds) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            
            const stmt = db.prepare('UPDATE TodoItem SET SortOrder = ? WHERE ID = ?;');
            
            orderedIds.forEach((id, index) => {
                stmt.run(index, id);
            });
            
            stmt.finalize();
            
            db.run('COMMIT;', function(err) {
                if (err) {
                    console.error("Erro na reordenação:", err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    });
}

// Ler todos os itens da base de dados.
function GetItemsAsync() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM TodoItem ORDER BY SortOrder ASC", [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Mapeamento: Converte o 'Done' de 0/1 para false/true (para ser amigável no Frontend)
            const items = rows.map(row => ({
                ID: row.ID,
                Name: row.Name,
                Notes: row.Notes,

                Done: row.Done === 1,

                CreatedAt: row.CreatedAt,
                DueDate: row.DueDate,
                CompletedAt: row.CompletedAt
            }));
            
            resolve(items);
        });
    });
}

// inserir novo item

function SaveItemAsync(item) {
    return new Promise((resolve, reject) => {
        // Converte o boolean de volta para 0 ou 1 para o SQLite
        const isDone = item.Done ? 1 : 0; 
        let completedAt = item.CompletedAt; // mantém data existente

        if (item.Done && !completedAt) {
            completedAt = new Date().toISOString(); // define data se não existir
        }

        if (!item.Done) {
            completedAt = null; // limpa se não estiver concluído
        }
        if (item.ID) {
            // Se tem ID faz UPDATE
            const query = `
                UPDATE TodoItem
                SET Name = ?,
                    Notes = ?,
                    Done = ?,
                    DueDate = ?,
                    CompletedAt = ?
                WHERE ID = ?
            `;

            db.run(query, [
                    item.Name,
                    item.Notes,
                    isDone,
                    item.DueDate,
                    completedAt,
                    item.ID
                ], function(err) {
                if (err) reject(err);
                // 'this.changes' devolve o número de linhas modificadas
                else resolve(this.changes); 
            });
        } else {

            // Se não tem ID, faz INSERT
            const query = `
                INSERT INTO TodoItem
                (Name, Notes, Done, DueDate, CompletedAt)
                VALUES (?, ?, ?, ?, ?)
            `;
            db.run(query,
                [
                    item.Name,
                    item.Notes,
                    isDone,
                    item.DueDate,
                    completedAt
                ], function(err) {
                if (err) reject(err);
                // 'this.lastID' devolve o ID gerado automaticamente
                else resolve(this.lastID); 
            });
        }
    });
}

// apagar 
function DeleteItemAsync(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM TodoItem WHERE ID = ?`, [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

// Exportar as funções para poderem ser importadas no main.js
module.exports = {
    InitDatabase,
    GetItemsAsync,
    SaveItemAsync,
    DeleteItemAsync,
    UpdateItemsOrderAsync
};