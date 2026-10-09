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
  danger: "#f46a6a",
  info: "#50a5f1",
  muted: "#74788d",
};


const normalize = value =>
  String(value || "")
    .trim()
    .toLowerCase();


const esPagoCompleto = estado =>
  [
    "pagado",
    "completado",
    "completo",
    "aprobado",
  ].includes(normalize(estado));


const esPedidoCompleto = estado =>
  [
    "completado",
    "completo",
    "finalizado",
    "pagado",
  ].includes(normalize(estado));


const esPendiente = estado =>
  [
    "pendiente",
    "en proceso",
    "procesando",
  ].includes(normalize(estado));


const claveMes = fecha => {

  if (!fecha) {
    return null;
  }

  const d = new Date(fecha);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
};


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


const formatoMoneda = valor =>
  new Intl.NumberFormat(
    "es-GT",
    {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }
  ).format(Number(valor || 0));


const colorEstado = estado => {

  if (esPedidoCompleto(estado)) {
    return "success";
  }

  if (esPendiente(estado)) {
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
              <i
                className={`${icon} font-size-24`}
              />
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

  document.title = "Dashboard | Warlus CRM";

  const [estados, setEstados] = useState({});

  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [cargandoDatos, setCargandoDatos] =
    useState(true);

  const [errorDatos, setErrorDatos] =
    useState(null);

  const [filtroMes, setFiltroMes] =
    useState("todos");

  const [filtroServicio, setFiltroServicio] =
    useState("todos");


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


  const cargarDatos = useCallback((mostrarCarga = true) => {

    if (mostrarCarga) {
      setCargandoDatos(true);
    }

    setErrorDatos(null);

    Promise.all([
      apiFetch("pedidos", "/pedidos"),
      apiFetch("pagos", "/pagos"),
      apiFetch("catalogo", "/servicios"),
    ])
      .then(
        ([
          pedidosData,
          pagosData,
          serviciosData,
        ]) => {

          setPedidos(
            Array.isArray(pedidosData)
              ? pedidosData
              : []
          );

          setPagos(
            Array.isArray(pagosData)
              ? pagosData
              : []
          );

          setServicios(
            Array.isArray(serviciosData)
              ? serviciosData
              : []
          );
        }
      )
      .catch(() =>
        setErrorDatos(
          "No fue posible cargar el resumen comercial."
        )
      )
      .finally(() => {
        if (mostrarCarga) {
          setCargandoDatos(false);
        }
      });

  }, []);


  useEffect(() => {

    verificar();
    cargarDatos();

    const intervalo = window.setInterval(() => {

      verificar();

      // Refresco silencioso:
      // actualiza KPI, tablas y graficas
      // sin mostrar nuevamente "Cargando..."
      cargarDatos(false);

    }, 30000);

    return () => {
      window.clearInterval(intervalo);
    };

  }, [
    verificar,
    cargarDatos,
  ]);


  const serviciosPorId = useMemo(
    () =>
      new Map(
        servicios.map(servicio => [
          String(servicio.id),
          servicio.nombre,
        ])
      ),
    [servicios]
  );


  const pedidosPorId = useMemo(
    () =>
      new Map(
        pedidos.map(pedido => [
          String(pedido.id),
          pedido,
        ])
      ),
    [pedidos]
  );


  const meses = useMemo(() => {

    const valores = new Set();

    [
      ...pedidos.map(p => p.created_at),
      ...pagos.map(p => p.created_at),
    ].forEach(fecha => {

      const key = claveMes(fecha);

      if (key) {
        valores.add(key);
      }
    });

    return Array.from(valores)
      .sort()
      .reverse()
      .map(key => {

        const [anio, mes] =
          key.split("-").map(Number);

        const fecha =
          new Date(anio, mes - 1, 1);

        const label =
          new Intl.DateTimeFormat(
            "es-GT",
            {
              month: "long",
              year: "numeric",
            }
          ).format(fecha);

        return {
          value: key,
          label:
            label.charAt(0).toUpperCase() +
            label.slice(1),
        };
      });

  }, [
    pedidos,
    pagos,
  ]);


  const pedidosFiltrados = useMemo(
    () =>
      pedidos.filter(pedido => {

        if (
          filtroServicio !== "todos" &&
          String(pedido.servicio_id) !==
            filtroServicio
        ) {
          return false;
        }

        if (
          filtroMes !== "todos" &&
          claveMes(pedido.created_at) !==
            filtroMes
        ) {
          return false;
        }

        return true;
      }),
    [
      pedidos,
      filtroMes,
      filtroServicio,
    ]
  );


  const pagosFiltrados = useMemo(
    () =>
      pagos.filter(pago => {

        const pedido =
          pedidosPorId.get(
            String(pago.pedido_id)
          );

        if (
          filtroServicio !== "todos"
        ) {

          if (
            !pedido ||
            String(pedido.servicio_id) !==
              filtroServicio
          ) {
            return false;
          }
        }

        if (
          filtroMes !== "todos" &&
          claveMes(pago.created_at) !==
            filtroMes
        ) {
          return false;
        }

        return true;
      }),
    [
      pagos,
      pedidosPorId,
      filtroMes,
      filtroServicio,
    ]
  );


  const totalPedidos =
    pedidosFiltrados.length;


  const pagosCompletos =
    pagosFiltrados.filter(pago =>
      esPagoCompleto(pago.estado)
    ).length;


  const pedidosPendientes =
    pedidosFiltrados.filter(pedido =>
      esPendiente(pedido.estado)
    ).length;


  const ingresoHistorico =
    pagos
      .filter(pago =>
        esPagoCompleto(pago.estado)
      )
      .reduce(
        (total, pago) =>
          total + Number(pago.monto || 0),
        0
      );


  const pedidosCompletos =
    pedidosFiltrados.filter(pedido =>
      esPedidoCompleto(pedido.estado)
    ).length;


  const otrosPedidos =
    Math.max(
      0,
      totalPedidos -
        pedidosCompletos -
        pedidosPendientes
    );


  const estadoSeries = [
    pedidosCompletos,
    pedidosPendientes,
    otrosPedidos,
  ];


  const estadoOptions = {
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

    dataLabels: {
      enabled: true,
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
                String(totalPedidos),
            },
          },
        },
      },
    },

    noData: {
      text: "Sin datos",
    },
  };


  const ingresoServicio = useMemo(() => {

    const acumulado = new Map();

    pagosFiltrados
      .filter(pago =>
        esPagoCompleto(pago.estado)
      )
      .forEach(pago => {

        const pedido =
          pedidosPorId.get(
            String(pago.pedido_id)
          );

        if (!pedido) {
          return;
        }

        const servicioId =
          String(pedido.servicio_id);

        const nombre =
          serviciosPorId.get(servicioId) ||
          `Servicio #${servicioId}`;

        acumulado.set(
          nombre,
          (
            acumulado.get(nombre) || 0
          ) + Number(pago.monto || 0)
        );
      });

    return Array.from(
      acumulado.entries()
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  }, [
    pagosFiltrados,
    pedidosPorId,
    serviciosPorId,
  ]);


  const ingresoCategorias =
    ingresoServicio.length
      ? ingresoServicio.map(
          item => item[0]
        )
      : ["Sin datos"];


  const ingresoValores =
    ingresoServicio.length
      ? ingresoServicio.map(
          item => item[1]
        )
      : [0];


  const ingresoOptions = {

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
        ingresoCategorias,

      labels: {
        rotate: -20,
      },
    },

    yaxis: {
      labels: {
        formatter: value =>
          `Q ${Number(value).toLocaleString(
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

    noData: {
      text: "Sin datos",
    },
  };


  const ingresoSeries = [
    {
      name: "Ingresos",
      data: ingresoValores,
    },
  ];


  const actividadReciente =
    useMemo(
      () =>
        [...pedidosFiltrados]
          .sort(
            (a, b) =>
              new Date(
                b.created_at || 0
              ) -
              new Date(
                a.created_at || 0
              )
          )
          .slice(0, 6),
      [pedidosFiltrados]
    );


  const actualizarTodo = () => {
    verificar();
    cargarDatos();
  };


  return (
    <React.Fragment>

      <div className="page-content">

        <Container fluid>

          <Breadcrumbs
            title={props.t("Dashboards")}
            breadcrumbItem={props.t("Dashboard")}
          />


          <Row>

            <KpiCard
              title="Pedidos registrados"
              value={totalPedidos}
              helper="Segun los filtros actuales"
              icon="bx bx-cart"
              color="primary"
            />

            <KpiCard
              title="Pagos completados"
              value={pagosCompletos}
              helper="Transacciones finalizadas"
              icon="bx bx-check-circle"
              color="success"
            />

            <KpiCard
              title="Pendientes"
              value={pedidosPendientes}
              helper="Pedidos por completar"
              icon="bx bx-time-five"
              color="warning"
            />

            <KpiCard
              title="Ingresos historicos"
              value={formatoMoneda(
                ingresoHistorico
              )}
              helper="Acumulado de pagos completados"
              icon="bx bx-wallet"
              color="info"
            />

          </Row>


          <Card>

            <CardBody>

              <Row className="align-items-end">

                <Col lg={6} className="mb-3 mb-lg-0">

                  <h4 className="card-title mb-1">
                    Resumen comercial
                  </h4>

                  <p className="text-muted mb-0">
                    Consulta pedidos e ingresos sin perder
                    la vista general del negocio.

                    <span className="d-block text-success mt-1">
                      <i className="bx bx-refresh me-1" />
                      Actualizacion automatica cada 30 segundos
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
                        key={mes.value}
                        value={mes.value}
                      >
                        {mes.label}
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
                    value={filtroServicio}
                    onChange={e =>
                      setFiltroServicio(
                        e.target.value
                      )
                    }
                  >

                    <option value="todos">
                      Todos
                    </option>

                    {servicios.map(servicio => (
                      <option
                        key={servicio.id}
                        value={String(
                          servicio.id
                        )}
                      >
                        {servicio.nombre}
                      </option>
                    ))}

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
                    onClick={actualizarTodo}
                  >
                    <i className="bx bx-refresh me-1" />
                    Actualizar
                  </Button>

                </Col>

              </Row>

            </CardBody>

          </Card>


          {errorDatos ? (

            <Card>
              <CardBody>
                <p className="text-danger mb-0">
                  {errorDatos}
                </p>
              </CardBody>
            </Card>

          ) : null}


          <Row>

            <Col xl={5}>

              <Card>

                <CardBody>

                  <h4 className="card-title mb-1">
                    Estado de pedidos
                  </h4>

                  <p className="text-muted mb-3">
                    Distribucion segun los filtros seleccionados.
                  </p>

                  {cargandoDatos ? (

                    <div className="text-center py-5 text-muted">
                      Cargando...
                    </div>

                  ) : (

                    <ReactApexChart
                      options={estadoOptions}
                      series={estadoSeries}
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
                    Ingresos por servicio
                  </h4>

                  <p className="text-muted mb-3">
                    Solo considera pagos completados.
                  </p>

                  {cargandoDatos ? (

                    <div className="text-center py-5 text-muted">
                      Cargando...
                    </div>

                  ) : (

                    <ReactApexChart
                      options={ingresoOptions}
                      series={ingresoSeries}
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

              <div className="d-flex align-items-center justify-content-between mb-3">

                <div>

                  <h4 className="card-title mb-1">
                    Actividad reciente
                  </h4>

                  <p className="text-muted mb-0">
                    Ultimos pedidos registrados.
                  </p>

                </div>

              </div>


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

                    {actividadReciente.length === 0 ? (

                      <tr>

                        <td
                          colSpan={4}
                          className="text-center text-muted py-4"
                        >
                          No hay pedidos para los filtros seleccionados.
                        </td>

                      </tr>

                    ) : (

                      actividadReciente.map(
                        pedido => (

                          <tr key={pedido.id}>

                            <td className="fw-medium">
                              {pedido.cliente}
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
                                {pedido.estado}
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

                    )}

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
                Disponibilidad tecnica del sistema.
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

            {SERVICIOS.map(servicio => {

              const estado =
                estados[servicio];

              const color =
                estado === "OK"
                  ? "success"
                  : estado === "cargando"
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
                            {estado ?? "-"}
                          </h5>

                        </div>

                      </div>

                    </CardBody>

                  </Card>

                </Col>

              );
            })}

          </Row>

        </Container>

      </div>

    </React.Fragment>
  );
};


Dashboard.propTypes = {
  t: PropTypes.any,
};


export default withTranslation()(Dashboard);