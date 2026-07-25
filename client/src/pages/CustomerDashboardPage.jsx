import { Link } from "react-router-dom";
import CustomerDashboard from "../components/CustomerDashboard"

const customerHome = () => {
  
  return (
    <div className="dashboard-customer">
      <CustomerDashboard/>
    </div>
  );
}

export default customerHome;