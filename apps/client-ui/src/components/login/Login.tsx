import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.scss";
import { jwtDecode } from "jwt-decode";
import { useStore } from "../../store/store";
import { ICredentials, IStore } from "../../store";
import { AddUserService } from "../../services/add-user/AddUserService";
import { PixelCard } from "../../ui";

const LoginPage: React.FC = () => {
  const setCredentials = useStore((state: IStore) => state.setCredentials);

  const handleLoginSuccess = async (response: any) => {
    try {
      const decodedToken: ICredentials = jwtDecode(response?.credential);
      setCredentials(decodedToken);
      const addUserService = new AddUserService();
      await addUserService.addUser(decodedToken);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <PixelCard title="FLUX // MESSENGER" variant="primary">
        <div className={styles.inner}>
          <div className={styles.logoMark} aria-hidden="true">
            <span className={styles.logoF}>F</span>
            <span className={styles.logoL}>L</span>
            <span className={styles.logoU}>U</span>
            <span className={styles.logoX}>X</span>
          </div>

          <h1 className={styles.title}>Log into Flux</h1>

          <p className={styles.subtitle}>
            Message privately with friends and family using Flux on your browser.
          </p>

          <hr className={styles.divider} />

          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.error("Google Login Failed")}
          />
        </div>
      </PixelCard>
    </div>
  );
};

export default LoginPage;
