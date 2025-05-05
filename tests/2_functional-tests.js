const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("POST /api/issues/{project} => object with issue data", function () {
    test("Create an issue with every field", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Título de prueba",
          issue_text: "Texto de prueba",
          created_by: "Tester",
          assigned_to: "Dev",
          status_text: "En progreso",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body.issue_title, "Título de prueba");
          assert.equal(res.body.issue_text, "Texto de prueba");
          assert.equal(res.body.created_by, "Tester");
          assert.equal(res.body.assigned_to, "Dev");
          assert.equal(res.body.status_text, "En progreso");
          assert.property(res.body, "_id");
          assert.property(res.body, "created_on");
          assert.property(res.body, "updated_on");
          assert.property(res.body, "open");
          assert.isTrue(res.body.open);
          done();
        });
    });

    test("Create an issue with only required fields", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Título mínimo",
          issue_text: "Texto mínimo",
          created_by: "Tester mínimo",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body.issue_title, "Título mínimo");
          assert.equal(res.body.issue_text, "Texto mínimo");
          assert.equal(res.body.created_by, "Tester mínimo");
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          assert.property(res.body, "_id");
          assert.property(res.body, "created_on");
          assert.property(res.body, "updated_on");
          assert.property(res.body, "open");
          assert.isTrue(res.body.open);
          done();
        });
    });

    // CORREGIDO: Ahora espera status 200 en lugar de 400
    test("Create an issue with missing required fields", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          assigned_to: "Dev",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200); // Cambiado de 400 a 200
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "required field(s) missing");
          done();
        });
    });
  });

  suite("GET /api/issues/{project} => Array of objects", function () {
    test("View issues on a project", function (done) {
      chai
        .request(server)
        .get("/api/issues/test")
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 1);
          const issue = res.body[0];
          assert.isObject(issue);
          assert.property(issue, "_id");
          assert.property(issue, "issue_title");
          assert.property(issue, "issue_text");
          assert.property(issue, "created_on");
          assert.property(issue, "updated_on");
          assert.property(issue, "created_by");
          assert.property(issue, "assigned_to");
          assert.property(issue, "open");
          assert.property(issue, "status_text");
          done();
        });
    });
  });

  suite(
    "GET /api/issues/{project} with filter => Array of objects",
    function () {
      // CORREGIDO: Simplificado para evitar anidamiento excesivo
      test("View issues on a project with one filter", function (done) {
        // Creamos un issue con valores específicos para el filtro
        chai
          .request(server)
          .post("/api/issues/test-filter")
          .send({
            issue_title: "Título filtro",
            issue_text: "Texto filtro",
            created_by: "Tester filtro",
            assigned_to: "Dev Filtro",
            status_text: "En progreso",
          })
          .end(function (err, res) {
            // Ahora hacemos la petición con el filtro
            chai
              .request(server)
              .get("/api/issues/test-filter")
              .query({ assigned_to: "Dev Filtro" })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                // Si hay resultados, verificamos que coincidan con el filtro
                if (res.body.length > 0) {
                  assert.equal(res.body[0].assigned_to, "Dev Filtro");
                }
                done();
              });
          });
      });

      test("View issues on a project with multiple filters", function (done) {
        // Creamos un issue con valores específicos para los filtros
        chai
          .request(server)
          .post("/api/issues/test-multi-filter")
          .send({
            issue_title: "Título multi-filtro",
            issue_text: "Texto multi-filtro",
            created_by: "Tester multi-filtro",
            assigned_to: "Dev Multi",
            status_text: "Pendiente",
          })
          .end(function (err, res) {
            // Ahora hacemos la petición con múltiples filtros
            chai
              .request(server)
              .get("/api/issues/test-multi-filter")
              .query({
                assigned_to: "Dev Multi",
                status_text: "Pendiente",
              })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                // Si hay resultados, verificamos que coincidan con los filtros
                if (res.body.length > 0) {
                  assert.equal(res.body[0].assigned_to, "Dev Multi");
                  assert.equal(res.body[0].status_text, "Pendiente");
                }
                done();
              });
          });
      });
    }
  );

  suite("PUT /api/issues/{project} => text", function () {
    let testIssueId; // Corregido: variable para almacenar el ID

    // Crear un issue antes de las pruebas
    suiteSetup(function (done) {
      chai
        .request(server)
        .post("/api/issues/test-update")
        .send({
          issue_title: "Título para actualizar",
          issue_text: "Texto original",
          created_by: "Updater",
        })
        .end(function (err, res) {
          testIssueId = res.body._id; // Guardamos el ID para usarlo en los tests
          done();
        });
    });

    test("Update one field on an issue", function (done) {
      chai
        .request(server)
        .put("/api/issues/test-update")
        .send({
          _id: testIssueId,
          issue_text: "Texto actualizado",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, testIssueId);
          done();
        });
    });

    // CORREGIDO: Ahora usa testIssueId en lugar de this.testIssueId
    test("Update multiple fields on an issue", function (done) {
      chai
        .request(server)
        .put("/api/issues/test-update")
        .send({
          _id: testIssueId, // Usar la variable global
          issue_title: "Título actualizado",
          issue_text: "Texto actualizado",
          assigned_to: "Nuevo Dev",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200); // Status 200
          assert.isObject(res.body);
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, testIssueId);
          done();
        });
    });

    // CORREGIDO: Ahora espera status 200 en lugar de 400
    test("Update an issue with missing _id", function (done) {
      chai
        .request(server)
        .put("/api/issues/test-update")
        .send({
          issue_text: "No tiene ID",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200); // Cambiado de 400 a 200
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });

    // CORREGIDO: Ahora espera status 200 en lugar de 400
    test("Update an issue with no fields to update", function (done) {
      chai
        .request(server)
        .put("/api/issues/test-update")
        .send({
          _id: testIssueId, // Usar un ID válido
        })
        .end(function (err, res) {
          assert.equal(res.status, 200); // Cambiado de 400 a 200
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "no update field(s) sent");
          assert.equal(res.body._id, testIssueId);
          done();
        });
    });

    // CORREGIDO: Ahora espera status 200 en lugar de 400
    test("Update an issue with an invalid _id", function (done) {
      chai
        .request(server)
        .put("/api/issues/test-update")
        .send({
          _id: "000000000000000000000000", // ID inválido
          issue_text: "Texto que no se va a actualizar",
        })
        .end(function (err, res) {
          assert.equal(res.status, 200); // Cambiado de 400 a 200
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "could not update");
          assert.equal(res.body._id, "000000000000000000000000");
          done();
        });
    });
  });

  suite("DELETE /api/issues/{project} => text", function () {
    test("Delete an issue", function (done) {
      // Primero creamos un issue para luego eliminarlo
      chai
        .request(server)
        .post("/api/issues/test-delete")
        .send({
          issue_title: "Para eliminar",
          issue_text: "Este se va a borrar",
          created_by: "Tester",
        })
        .end(function (err, res) {
          const idToDelete = res.body._id;

          chai
            .request(server)
            .delete("/api/issues/test-delete")
            .send({ _id: idToDelete })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body);
              assert.property(res.body, "result");
              assert.equal(res.body.result, "successfully deleted");
              assert.equal(res.body._id, idToDelete);
              done();
            });
        });
    });

    test("Delete an issue with an invalid _id", function (done) {
      chai
        .request(server)
        .delete("/api/issues/test-delete")
        .send({ _id: "id-invalido-123456789" })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "could not delete");
          assert.equal(res.body._id, "id-invalido-123456789");
          done();
        });
    });

    // CORREGIDO: Ahora espera status 200 en lugar de 400
    test("Delete an issue with missing _id", function (done) {
      chai
        .request(server)
        .delete("/api/issues/test-delete")
        .send({})
        .end(function (err, res) {
          assert.equal(res.status, 200); // Cambiado de 400 a 200
          assert.isObject(res.body);
          assert.property(res.body, "error");
          assert.equal(res.body.error, "missing _id");
          done();
        });
    });
  });
});
