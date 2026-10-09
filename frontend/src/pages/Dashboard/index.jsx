import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Table,
} from "reactstrap";

import ReactApexChart from "react-apexcharts";

import Breadcrumbs from "../../components/Common/Breadcrumb";

import {
  SERVICIOS,
  apiFetch,
  getHealth,
} from "../../api/client";

import { withTranslation } from "react-i18next";


const COLORS = {
  primary: "#556ee6",
  success: "#34c38f",
  warning: "#f1b44c",
  info: "#50a5f1",
};


const formatoMoneda = valor =>
  new Intl.NumberFormat(
    "es-GT",
    {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }
  ).format(Number(valor || 0));


const formatoFecha = fecha => {
  if (!fecha) {
    return "Sin fecha";
  }

  const d = new Date(fecha);

  if (Number.isNaN(d.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(d);
};


const colorEstado = estado => {
  const value =
    String(estado || "")
      .toLowerCase();

  if (
    value === "completado" ||
    value === "cerrado"
  ) {
    return "success";
  }

  if (
    value === "pendiente" ||
    value === "en proceso"
  ) {
    return "warning";
  }

  return "primary";
};


const ICONOS = {
  auth: "bx bx-lock-alt",
  catalogo: "bx bx-package",
  pedidos: "bx bx-cart",
  pagos: "bx bx-credit-card",
};


const KpiCard = ({
  title,
  value,
  helper,
  icon,
  color,
}) => (
  <Col sm={6} xl={3}>
    <Card className="mini-stats-wid">
      <CardBody>
        <div className="d-flex">
          <div className="flex-grow-1">
            <p className="text-muted fw-medium mb-2">
              {title}
            </p>

            <h4 className="mb-1">
              {value}
            </h4>

            <small className="text-muted">
              {helper}
            </small>
          </div>

          <div
            className={`avatar-sm rounded-circle bg-${color} align-self-center mini-stat-icon`}
          >
            <span
              className={`avatar-title rounded-circle bg-${color}`}
            >
              <i className={`${icon} font-size-24`} />
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  </Col>
);


KpiCard.propTypes = {
  title: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  helper: PropTypes.string,
  icon: PropTypes.string,
  color: PropTypes.string,
};


const Dashboard = props => {
  document.title =
    "Dashboard | Warlus CRM";

  const [estados, setEstados] =
    useState({});

  const [servicios, setServicios] =
    useState([]);

  const [misPedidos, setMisPedidos] =
    useState([]);

  const [
    resumenPedidos,
    setResumenPedidos,
  ] = useState({
    total: 0,
    completados: 0,
    pendientes: 0,
    otros: 0,
    por_servicio: [],
    meses_disponibles: [],
  });

  const [
    resumenPagos,
    setResumenPagos,
  ] = useState({
    total: 0,
    completados: 0,
    pendientes: 0,
    monto_completado: "0",
    por_servicio: [],
  });

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [filtroMes, setFiltroMes] =
    useState("todos");

  const [
    filtroServicio,
    setFiltroServicio,
  ] = useState("todos");


  const verificar = useCallback(() => {
    SERVICIOS.forEach(servicio => {
      setEstados(prev => ({
        ...prev,
        [servicio]: "cargando",
      }));

      getHealth(servicio)
        .then(data =>
          setEstados(prev => ({
            ...prev,
            [servicio]: data.status,
          }))
        )
        .catch(() =>
          setEstados(prev => ({
            ...prev,
            [servicio]: "caido",
          }))
        );
    });
  }, []);


  const queryString = useMemo(() => {
    const params =
      new URLSearchParams();

    if (filtroMes !== "todos") {
      params.set(
        "mes",
        filtroMes
      );
    }

    if (
      filtroServicio !== "todos"
    ) {
      params.set(
        "servicio_id",
        filtroServicio
      );
    }

    const value = params.toString();

    return value
      ? `?${value}`
      : "";
  }, [
    filtroMes,
    filtroServicio,
  ]);


  const cargarDatos = useCallback(
    (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      setError(null);

      Promise.all([
        apiFetch(
          "pedidos",
          `/pedidos/resumen/global${queryString}`
        ),
        apiFetch(
          "pagos",
          `/pagos/resumen/global${queryString}`
        ),
        apiFetch(
          "catalogo",
          "/servicios"
        ),
        apiFetch(
          "pedidos",
          "/pedidos"
        ),
      ])
        .then(
          ([
            pedidosResumen,
            pagosResumen,
            serviciosData,
            pedidosMios,
          ]) => {
            setResumenPedidos(
              pedidosResumen
            );

            setResumenPagos(
              pagosResumen
            );

            setServicios(
              Array.isArray(
                serviciosData
              )
                ? serviciosData
                : []
            );

            setMisPedidos(
              Array.isArray(
                pedidosMios
              )
                ? pedidosMios
                : []
            );
          }
        )
        .catch(err =>
          setError(
            err?.message ||
            "No fue posible cargar el dashboard."
          )
        )
        .finally(() => {
          if (mostrarCarga) {
            setCargando(false);
          }
        });
    },
    [queryString]
  );


  useEffect(() => {
    verificar();
    cargarDatos();

    const intervalo =
      window.setInterval(() => {
        verificar();
        cargarDatos(false);
      }, 30000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    verificar,
    cargarDatos,
  ]);


  const serviciosPorId =
    useMemo(
      () =>
        new Map(
          servicios.map(
            servicio => [
              String(servicio.id),
              servicio.nombre,
            ]
          )
        ),
      [servicios]
    );


  const actividadReciente =
    useMemo(() => {
      return [...misPedidos]
        .filter(pedido => {
          if (
            filtroServicio !==
              "todos" &&
            String(
              pedido.servicio_id
            ) !== filtroServicio
          ) {
            return false;
          }

          if (
            filtroMes !== "todos"
          ) {
            const fecha =
              pedido.created_at
                ? new Date(
                    pedido.created_at
                  )
                : null;

            if (
              !fecha ||
              Number.isNaN(
                fecha.getTime()
              )
            ) {
              return false;
            }

            const key =
              `${fecha.getFullYear()}-${String(
                fecha.getMonth() + 1
              ).padStart(2, "0")}`;

            if (key !== filtroMes) {
              return false;
            }
          }

          return true;
        })
        .slice(0, 6);
    }, [
      misPedidos,
      filtroMes,
      filtroServicio,
    ]);


  const donutSeries = [
    Number(
      resumenPedidos.completados ||
      0
    ),
    Number(
      resumenPedidos.pendientes ||
      0
    ),
    Number(
      resumenPedidos.otros ||
      0
    ),
  ];


  const donutOptions = {
    chart: {
      type: "donut",
      toolbar: {
        show: false,
      },
    },

    labels: [
      "Completados",
      "Pendientes",
      "Otros",
    ],

    colors: [
      COLORS.success,
      COLORS.warning,
      COLORS.primary,
    ],

    legend: {
      position: "bottom",
    },

    stroke: {
      width: 0,
    },

    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Pedidos",
              formatter: () =>
                String(
                  resumenPedidos.total ||
                  0
                ),
            },
          },
        },
      },
    },
  };


  const ingresoItems =
    Array.isArray(
      resumenPagos.por_servicio
    )
      ? resumenPagos.por_servicio
      : [];


  const barOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
    },

    colors: [
      COLORS.primary,
    ],

    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "42%",
      },
    },

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: "#f1f1f1",
    },

    xaxis: {
      categories:
        ingresoItems.length
          ? ingresoItems.map(
              item =>
                item.servicio
            )
          : ["Sin datos"],

      labels: {
        rotate: -20,
      },
    },

    yaxis: {
      labels: {
        formatter: value =>
          `Q ${Number(
            value
          ).toLocaleString(
            "es-GT"
          )}`,
      },
    },

    tooltip: {
      y: {
        formatter: value =>
          formatoMoneda(value),
      },
    },
  };


  const barSeries = [
    {
      name: "Ingresos",
      data:
        ingresoItems.length
          ? ingresoItems.map(
              item =>
                Number(
                  item.monto ||
                  0
                )
            )
          : [0],
    },
  ];


  const meses =
    Array.isArray(
      resumenPedidos
        .meses_disponibles
    )
      ? resumenPedidos
          .meses_disponibles
      : [];


  const actualizarTodo = () => {
    verificar();
    cargarDatos();
  };


  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>

          <Breadcrumbs
            title={props.t(
              "Dashboards"
            )}
            breadcrumbItem={props.t(
              "Dashboard"
            )}
          />


          <Row>

            <KpiCard
              title="Pedidos registrados"
              value={
                resumenPedidos.total ||
                0
              }
              helper="Total general de todo el CRM"
              icon="bx bx-cart"
              color="primary"
            />

            <KpiCard
              title="Pagos completados"
              value={
                resumenPagos.completados ||
                0
              }
              helper="Total general de todo el CRM"
              icon="bx bx-check-circle"
              color="success"
            />

            <KpiCard
              title="Pendientes"
              value={
                resumenPedidos.pendientes ||
                0
              }
              helper="Pendientes y en proceso globales"
              icon="bx bx-time-five"
              color="warning"
            />

            <KpiCard
              title="Ingresos historicos"
              value={formatoMoneda(
                resumenPagos
                  .monto_completado
              )}
              helper="Ingresos completados de todo el CRM"
              icon="bx bx-wallet"
              color="info"
            />

          </Row>


          <Card>
            <CardBody>

              <Row className="align-items-end">

                <Col
                  lg={6}
                  className="mb-3 mb-lg-0"
                >

                  <h4 className="card-title mb-1">
                    Resumen comercial general
                  </h4>

                  <p className="text-muted mb-0">
                    Las graficas representan todos
                    los registros trabajados en el
                    CRM de forma agregada, sin
                    exponer datos personales de
                    otros usuarios.

                    <span className="d-block text-success mt-1">
                      <i className="bx bx-refresh me-1" />
                      Actualizacion automatica
                      cada 30 segundos
                    </span>
                  </p>

                </Col>


                <Col md={4} lg={2}>

                  <Label className="form-label">
                    Mes
                  </Label>

                  <Input
                    type="select"
                    value={filtroMes}
                    onChange={e =>
                      setFiltroMes(
                        e.target.value
                      )
                    }
                  >

                    <option value="todos">
                      Todos los meses
                    </option>

                    {meses.map(mes => (
                      <option
                        key={mes}
                        value={mes}
                      >
                        {mes}
                      </option>
                    ))}

                  </Input>

                </Col>


                <Col md={4} lg={2}>

                  <Label className="form-label">
                    Servicio
                  </Label>

                  <Input
                    type="select"
                    value={
                      filtroServicio
                    }
                    onChange={e =>
                      setFiltroServicio(
                        e.target.value
                      )
                    }
                  >

                    <option value="todos">
                      Todos
                    </option>

                    {servicios.map(
                      servicio => (
                        <option
                          key={
                            servicio.id
                          }
                          value={String(
                            servicio.id
                          )}
                        >
                          {
                            servicio.nombre
                          }
                        </option>
                      )
                    )}

                  </Input>

                </Col>


                <Col
                  md={4}
                  lg={2}
                  className="mt-3 mt-md-0"
                >

                  <Button
                    color="primary"
                    className="w-100"
                    onClick={
                      actualizarTodo
                    }
                  >
                    <i className="bx bx-refresh me-1" />
                    Actualizar
                  </Button>

                </Col>

              </Row>

            </CardBody>
          </Card>


          {error ? (
            <Card>
              <CardBody>
                <p className="text-danger mb-0">
                  {error}
                </p>
              </CardBody>
            </Card>
          ) : null}


          <Row>

            <Col xl={5}>
              <Card>
                <CardBody>

                  <h4 className="card-title mb-1">
                    Estado global de pedidos
                  </h4>

                  <p className="text-muted mb-3">
                    Todos los pedidos del CRM,
                    agrupados por estado.
                  </p>

                  {cargando ? (
                    <div className="text-center py-5 text-muted">
                      Cargando...
                    </div>
                  ) : (
                    <ReactApexChart
                      options={
                        donutOptions
                      }
                      series={
                        donutSeries
                      }
                      type="donut"
                      height={310}
                    />
                  )}

                </CardBody>
              </Card>
            </Col>


            <Col xl={7}>
              <Card>
                <CardBody>

                  <h4 className="card-title mb-1">
                    Ingresos globales por servicio
                  </h4>

                  <p className="text-muted mb-3">
                    Totales del CRM sin mostrar
                    clientes, correos ni pedidos
                    de terceros.
                  </p>

                  {cargando ? (
                    <div className="text-center py-5 text-muted">
                      Cargando...
                    </div>
                  ) : (
                    <ReactApexChart
                      options={barOptions}
                      series={barSeries}
                      type="bar"
                      height={310}
                    />
                  )}

                </CardBody>
              </Card>
            </Col>

          </Row>


          <Card>
            <CardBody>

              <h4 className="card-title mb-1">
                Mi actividad reciente
              </h4>

              <p className="text-muted mb-3">
                Esta tabla es privada y solo
                contiene pedidos de la cuenta
                autenticada.
              </p>

              <div className="table-responsive">

                <Table
                  className="table-centered table-nowrap mb-0"
                >

                  <thead className="table-light">
                    <tr>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      actividadReciente
                        .length === 0
                        ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center text-muted py-4"
                            >
                              Aun no tienes pedidos
                              para estos filtros.
                            </td>
                          </tr>
                        )
                        : actividadReciente
                            .map(
                              pedido => (
                                <tr
                                  key={
                                    pedido.id
                                  }
                                >
                                  <td className="fw-medium">
                                    {
                                      pedido.cliente
                                    }
                                  </td>

                                  <td>
                                    {
                                      serviciosPorId.get(
                                        String(
                                          pedido.servicio_id
                                        )
                                      ) ||
                                      `Servicio #${pedido.servicio_id}`
                                    }
                                  </td>

                                  <td>
                                    <Badge
                                      color={colorEstado(
                                        pedido.estado
                                      )}
                                      pill
                                    >
                                      {
                                        pedido.estado
                                      }
                                    </Badge>
                                  </td>

                                  <td>
                                    {formatoFecha(
                                      pedido.created_at
                                    )}
                                  </td>
                                </tr>
                              )
                            )
                    }

                  </tbody>

                </Table>

              </div>

            </CardBody>
          </Card>


          <div className="d-flex justify-content-between align-items-center mt-2 mb-3">

            <div>
              <h4 className="card-title mb-1">
                Estado de los microservicios
              </h4>

              <p className="text-muted mb-0">
                Disponibilidad tecnica del
                sistema.
              </p>
            </div>

            <Button
              color="light"
              size="sm"
              onClick={verificar}
            >
              <i className="bx bx-refresh me-1" />
              Verificar
            </Button>

          </div>


          <Row>

            {SERVICIOS.map(
              servicio => {
                const estado =
                  estados[servicio];

                const color =
                  estado === "OK"
                    ? "success"
                    : estado ===
                        "cargando"
                      ? "warning"
                      : "danger";

                return (
                  <Col
                    sm={6}
                    xl={3}
                    key={servicio}
                  >
                    <Card>
                      <CardBody className="py-3">

                        <div className="d-flex align-items-center">

                          <div
                            className={`avatar-sm rounded-circle bg-${color} me-3`}
                          >
                            <span
                              className={`avatar-title rounded-circle bg-${color}`}
                            >
                              <i
                                className={`${ICONOS[servicio]} font-size-20`}
                              />
                            </span>
                          </div>

                          <div>
                            <p className="text-muted text-capitalize mb-1">
                              {servicio}
                            </p>

                            <h5
                              className={`mb-0 text-${color}`}
                            >
                              {
                                estado ??
                                "-"
                              }
                            </h5>
                          </div>

                        </div>

                      </CardBody>
                    </Card>
                  </Col>
                );
              }
            )}

          </Row>

        </Container>
      </div>
    </React.Fragment>
  );
};


Dashboard.propTypes = {
  t: PropTypes.any,
};


export default withTranslation()(
  Dashboard
);