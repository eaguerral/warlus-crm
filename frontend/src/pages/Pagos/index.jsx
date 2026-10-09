import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Table,
  Button,
  UncontrolledTooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import Swal from "sweetalert2";

import Breadcrumbs from "../../components/Common/Breadcrumb";
import { apiFetch } from "../../api/client";

const FORM_INICIAL = {
  pedido_id: "",
  monto: "",
  metodo: "",
  estado: "pendiente",
};

const Pagos = () => {
  document.title = "Pagos | Warlus CRM";

  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pagoEnEdicion, setPagoEnEdicion] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    apiFetch("pagos", "/pagos")
      .then((data) => setPagos(data))
      .catch(() => setError("No se pudo cargar los pagos"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  const abrirModalCrear = () => {
    setPagoEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (pago) => {
    setPagoEnEdicion(pago);
    setForm({
      pedido_id: String(pago.pedido_id),
      monto: String(pago.monto),
      metodo: pago.metodo,
      estado: pago.estado,
    });
    setErrorForm(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.pedido_id || !form.monto || !form.metodo) {
      setErrorForm("Pedido, monto y metodo son obligatorios");
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      pedido_id: parseInt(form.pedido_id, 10),
      monto: parseFloat(form.monto),
      metodo: form.metodo,
      estado: form.estado || "pendiente",
    };

    const peticion = pagoEnEdicion
      ? apiFetch("pagos", `/pagos/${pagoEnEdicion.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : apiFetch("pagos", "/pagos", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    peticion
      .then(() => {
        setModalAbierto(false);
        cargar();
        Swal.fire({
          icon: "success",
          title: pagoEnEdicion ? "Editado con exito" : "Creado con exito",
          timer: 1500,
          showConfirmButton: false,
        });
      })
      .catch(() => setErrorForm("No se pudo guardar el pago"))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (pago) => {
    Swal.fire({
      title: `¿Eliminar el pago del pedido #${pago.pedido_id}?`,
      text: "Esta accion no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f46a6a",
      cancelButtonColor: "#74788d",
      confirmButtonText: "Si, borrar",
      cancelButtonText: "Cancelar",
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        apiFetch("pagos", `/pagos/${pago.id}`, { method: "DELETE" })
          .then(() => {
            cargar();
            Swal.fire({
              icon: "success",
              title: "Borrado con exito",
              timer: 1500,
              showConfirmButton: false,
            });
          })
          .catch(() =>
            Swal.fire("Error", "No se pudo eliminar el pago", "error")
          );
      }
    });
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Pagos" breadcrumbItem="Pagos" />

        <Card>
          <CardBody>
            <div className="d-flex justify-content-end mb-3">
              <Button
                color="primary"
                id="btn-crear-pago"
                size="sm"
                onClick={abrirModalCrear}
              >
                <i className="bx bx-plus" />
              </Button>
              <UncontrolledTooltip placement="top" target="btn-crear-pago">
                Crear
              </UncontrolledTooltip>
            </div>

            {error ? <p className="text-danger">{error}</p> : null}

            <Table responsive className="table-centered table-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>Pedido</th>
                  <th>Monto</th>
                  <th>Metodo</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : pagos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      Sin pagos registrados
                    </td>
                  </tr>
                ) : (
                  pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td>{pago.pedido_id}</td>
                      <td>{pago.monto}</td>
                      <td>{pago.metodo}</td>
                      <td>{pago.estado}</td>
                      <td>
                        <Button
                          color="warning"
                          size="sm"
                          className="me-1"
                          id={`btn-editar-${pago.id}`}
                          onClick={() => abrirModalEditar(pago)}
                        >
                          <i className="bx bx-pencil" />
                        </Button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`btn-editar-${pago.id}`}
                        >
                          Editar
                        </UncontrolledTooltip>

                        <Button
                          color="danger"
                          size="sm"
                          id={`btn-borrar-${pago.id}`}
                          onClick={() => handleEliminar(pago)}
                        >
                          <i className="bx bx-trash" />
                        </Button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`btn-borrar-${pago.id}`}
                        >
                          Borrar
                        </UncontrolledTooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Modal isOpen={modalAbierto} toggle={cerrarModal}>
          <ModalHeader toggle={cerrarModal}>
            {pagoEnEdicion ? "Editar pago" : "Crear pago"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              {errorForm ? <p className="text-danger">{errorForm}</p> : null}

              <FormGroup>
                <Label for="pedido_id">ID de pedido</Label>
                <Input
                  id="pedido_id"
                  name="pedido_id"
                  type="number"
                  min="1"
                  value={form.pedido_id}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="monto">Monto</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="metodo">Metodo</Label>
                <Input
                  id="metodo"
                  name="metodo"
                  value={form.metodo}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button type="button" color="secondary" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit" color="primary" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default Pagos;
