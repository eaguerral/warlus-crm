import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Col, Container, Row } from "reactstrap";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

//i18n
import { withTranslation } from "react-i18next";

import { SERVICIOS, getHealth } from "../../api/client";

const ICONOS = {
  auth: "bx bx-lock-alt",
  catalogo: "bx bx-package",
  pedidos: "bx bx-cart",
  pagos: "bx bx-credit-card",
};

const Dashboard = (props) => {
  //meta title
  document.title = "Dashboard | Warlus CRM";

  const [estados, setEstados] = useState({});

  const verificar = useCallback(() => {
    SERVICIOS.forEach((servicio) => {
      setEstados((prev) => ({ ...prev, [servicio]: "cargando" }));
      getHealth(servicio)
        .then((data) => setEstados((prev) => ({ ...prev, [servicio]: data.status })))
        .catch(() => setEstados((prev) => ({ ...prev, [servicio]: "caido" })));
    });
  }, []);

  useEffect(verificar, [verificar]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Render Breadcrumb */}
          <Breadcrumbs title={props.t("Dashboards")} breadcrumbItem={props.t("Dashboard")} />

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="card-title mb-0">Estado de los microservicios</h4>
            <Button color="primary" size="sm" onClick={verificar}>
              <i className="bx bx-refresh me-1"></i> Actualizar
            </Button>
          </div>

          <Row>
            {SERVICIOS.map((servicio) => {
              const estado = estados[servicio];
              const color =
                estado === "OK" ? "success" : estado === "cargando" ? "warning" : "danger";

              return (
                <Col md={6} xl={3} key={servicio}>
                  <Card className="mini-stats-wid">
                    <CardBody>
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <p className="text-muted fw-medium text-capitalize">{servicio}</p>
                          <h4 className={`mb-0 text-${color}`}>{estado ?? "-"}</h4>
                        </div>
                        <div className="avatar-sm rounded-circle bg-primary align-self-center mini-stat-icon">
                          <span className="avatar-title rounded-circle bg-primary">
                            <i className={`${ICONOS[servicio]} font-size-24`}></i>
                          </span>
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
