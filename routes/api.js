"use strict";

module.exports = function (app) {
  let issues = {}; // almacén temporal en memoria

  // Ruta para obtener los issues de un proyecto
  app
    .route("/api/issues/:project")

    // GET - Ver todos los issues de un proyecto, con filtros opcionales
    .get(function (req, res) {
      let project = req.params.project;
      let filter = req.query; // Filtramos según los parámetros de la query

      if (!issues[project]) {
        return res.status(400).json({ error: "No issues for this project" });
      }

      let filteredIssues = issues[project];

      // Filtramos los issues si hay parámetros de consulta (query params)
      if (filter) {
        filteredIssues = filteredIssues.filter((issue) => {
          for (let key in filter) {
            if (issue[key] && issue[key] !== filter[key]) {
              return false;
            }
          }
          return true;
        });
      }

      res.json(filteredIssues);
    })

    // POST - Crear un nuevo issue en un proyecto
    .post(function (req, res) {
      let project = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = "",
        status_text = "",
      } = req.body;

      // Validación para asegurar que los campos requeridos estén presentes
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: "required field(s) missing" });
      }

      const newIssue = {
        _id: Date.now().toString(),
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
      };

      // Inicializamos el array de issues para el proyecto si no existe
      if (!issues[project]) issues[project] = [];
      issues[project].push(newIssue);

      res.json(newIssue);
    })

    // PUT - Actualizar un issue existente en un proyecto
    .put(function (req, res) {
      let project = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      // Verificamos que el _id esté presente
      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      // Verificamos que al menos un campo de actualización esté presente
      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        open === undefined
      ) {
        return res.json({ error: "no update field(s) sent", _id: _id });
      }

      if (!issues[project]) {
        return res.json({ error: "could not update", _id: _id });
      }

      let issueToUpdate = issues[project].find((issue) => issue._id === _id);

      if (!issueToUpdate) {
        return res.json({ error: "could not update", _id: _id });
      }

      // Actualizamos los campos proporcionados en el body
      if (issue_title) issueToUpdate.issue_title = issue_title;
      if (issue_text) issueToUpdate.issue_text = issue_text;
      if (created_by) issueToUpdate.created_by = created_by;
      if (assigned_to) issueToUpdate.assigned_to = assigned_to;
      if (status_text) issueToUpdate.status_text = status_text;
      if (open !== undefined) issueToUpdate.open = open;

      issueToUpdate.updated_on = new Date(); // Actualizamos la fecha de actualización

      res.json({ result: "successfully updated", _id: _id });
    })

    // DELETE - Eliminar un issue en un proyecto
    .delete(function (req, res) {
      let project = req.params.project;
      const { _id } = req.body;

      // Verificamos que el _id esté presente
      if (!_id) {
        return res.json({ error: "missing _id" });
      }

      if (!issues[project]) {
        return res.json({ error: "could not delete", _id: _id });
      }

      let index = issues[project].findIndex((issue) => issue._id === _id);

      if (index === -1) {
        return res.json({ error: "could not delete", _id: _id });
      }

      // Eliminamos el issue de la lista
      issues[project].splice(index, 1);

      res.json({ result: "successfully deleted", _id: _id });
    });
};
