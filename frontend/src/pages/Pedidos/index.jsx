import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  cliente: "",
  servicio_id: "",
  estado: "pendiente",
};

const Pedidos = () => {
  document.title = "Pedidos | Warlus CRM";

  const [pedidos, setPedidos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoEnEdicion, setPedidoEnEdicion] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);

    Promise.all([
      apiFetch("pedidos", "/pedidos"),
      apiFetch("catalogo", "/servicios"),
    ])
      .then(([pedidosData, serviciosData]) => {
        setPedidos(pedidosData);
        setServicios(serviciosData);
      })
      .catch((err) => setError(err?.message || "No se pudo cargar los pedidos"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  const serviciosActivos = useMemo(
    () => servicios.filter((servicio) => servicio.activo),
    [servicios]
  );

  const serviciosPorId = useMemo(
    () =>
      Object.fromEntries(
        servicios.map((servicio) => [String(servicio.id), servicio])
      ),
    [servicios]
  );

  const abrirModalCrear = () => {
    if (serviciosActivos.length === 0) {
      Swal.fire(
        "Sin servicios disponibles",
        "Debe existir al menos un servicio activo antes de crear un pedido.",
        "warning"
      );
      return;
    }

    setPedidoEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (pedido) => {
    setPedidoEnEdicion(pedido);
    setForm({
      cliente: pedido.cliente,
      servicio_id: String(pedido.servicio_id),
      estado: pedido.estado,
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

    if (!form.cliente.trim() || !form.servicio_id) {
      setErrorForm("Cliente y servicio son obligatorios");
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      cliente: form.cliente.trim(),
      servicio_id: parseInt(form.servicio_id, 10),
      estado: form.estado || "pendiente",
    };

    const peticion = pedidoEnEdicion
      ? apiFetch("pedidos", `/pedidos/${pedidoEnEdicion.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : apiFetch("pedidos", "/pedidos", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    peticion
      .then(() => {
        setModalAbierto(false);
        cargar();
        Swal.fire({
          icon: "success",
          title: pedidoEnEdicion ? "Editado con exito" : "Creado con exito",
          timer: 1500,
          showConfirmButton: false,
        });
      })
      .catch((err) => setErrorForm(err?.message || "No se pudo guardar el pedido"))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (pedido) => {
    Swal.fire({
      title: `¿Eliminar el pedido de "${pedido.cliente}"?`,
      text: "Esta accion no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f46a6a",
      cancelButtonColor: "#74788d",
      confirmButtonText: "Si, borrar",
      cancelButtonText: "Cancelar",
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        apiFetch("pedidos", `/pedidos/${pedido.id}`, { method: "DELETE" })
          .then(() => {
            cargar();
            Swal.fire({
              icon: "success",
              title: "Borrado con exito",
              timer: 1500,
              showConfirmButton: false,
            });
          })
          .catch((err) =>
            Swal.fire("Error", err?.message || "No se pudo eliminar el pedido", "error")
          );
      }
    });
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Pedidos" breadcrumbItem="Pedidos" />

        <Card>
          <CardBody>
            <div className="d-flex justify-content-end mb-3">
              <Button
                color="primary"
                id="btn-crear-pedido"
                size="sm"
                onClick={abrirModalCrear}
              >
                <i className="bx bx-plus" />
              </Button>
              <UncontrolledTooltip placement="top" target="btn-crear-pedido">
                Crear
              </UncontrolledTooltip>
            </div>

            {error ? <p className="text-danger">{error}</p> : null}

            <Table responsive className="table-centered table-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      Sin pedidos registrados
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => {
                    const servicio = serviciosPorId[String(pedido.servicio_id)];

                    return (
                      <tr key={pedido.id}>
                        <td>{pedido.cliente}</td>
                        <td>{servicio?.nombre || `Servicio #${pedido.servicio_id}`}</td>
                        <td>{pedido.estado}</td>
                        <td>
                          <Button
                            color="warning"
                            size="sm"
                            className="me-1"
                            id={`btn-editar-${pedido.id}`}
                            onClick={() => abrirModalEditar(pedido)}
                          >
                            <i className="bx bx-pencil" />
                          </Button>
                          <UncontrolledTooltip
                            placement="top"
                            target={`btn-editar-${pedido.id}`}
                          >
                            Editar
                          </UncontrolledTooltip>

                          <Button
                            color="danger"
                            size="sm"
                            id={`btn-borrar-${pedido.id}`}
                            onClick={() => handleEliminar(pedido)}
                          >
                            <i className="bx bx-trash" />
                          </Button>
                          <UncontrolledTooltip
                            placement="top"
                            target={`btn-borrar-${pedido.id}`}
                          >
                            Borrar
                          </UncontrolledTooltip>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Modal isOpen={modalAbierto} toggle={cerrarModal}>
          <ModalHeader toggle={cerrarModal}>
            {pedidoEnEdicion ? "Editar pedido" : "Crear pedido"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              {errorForm ? <p className="text-danger">{errorForm}</p> : null}

              <FormGroup>
                <Label for="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="servicio_id">Servicio</Label>
                <Input
                  id="servicio_id"
                  name="servicio_id"
                  type="select"
                  value={form.servicio_id}
                  onChange={handleChange}
                >
                  <option value="">Selecciona un servicio</option>
                  {serviciosActivos.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} - Q {Number(servicio.precio).toFixed(2)}
                      {servicio.tipo === "global" ? " (Global)" : ""}
                    </option>
                  ))}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label for="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  type="select"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en proceso">En proceso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="cerrado">Cerrado</option>
                </Input>
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

export default Pedidos;
