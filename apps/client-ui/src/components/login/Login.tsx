import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.scss";
import icon from "../../assets/whatsApp.svg";
import { jwtDecode } from "jwt-decode";
import { useStore } from "../../store/store";
import { ICredentials, IStore } from "../../store";
import { AddUserService } from "../../services/add-user/AddUserService";

const LoginPage: React.FC = () => {
  const setCredentials = useStore((state: IStore) => state.setCredentials);
  const credentials = useStore((state: IStore) => state.credentials);

  const handleLoginSuccess = async (response: any) => {
    try {
      const decodedToken: ICredentials = jwtDecode(response?.credential);

      setCredentials(decodedToken);

      const addUserService = new AddUserService();
      await addUserService.addUser(decodedToken);

      console.log("Decoded Token:", decodedToken);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  const handleLoginFailure = () => {
    console.log("Login Failed");
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <img className={styles.logo} src={icon} alt="WhatsApp" />
        <h1>Log into WhatsApp Web</h1>
        <div>
          Message privately with friends and family using WhatsApp on your
          browser.
        </div>
        <hr />
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
        />
      </div>
    </div>
  );
};

export default LoginPage;
