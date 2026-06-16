import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.scss";
import { useStore } from "../../store/store";
import { IStore } from "../../store";
import { authService } from "../../services/AuthService";
import { PixelCard } from "../../ui";

const LoginPage: React.FC = () => {
  const setCurrentUser = useStore((state: IStore) => state.setCurrentUser);
  const setToken = useStore((state: IStore) => state.setToken);

  const handleLoginSuccess = async (response: any) => {
    try {
      // Server-verified login: the backend validates the Google credential
      // and returns a Flux session JWT + the canonical user.
      const { token, user } = await authService.googleAuth(response?.credential);
      setToken(token);
      setCurrentUser(user);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <PixelCard title="FLUX // COMMUNITIES" variant="primary">
        <div className={styles.inner}>
          <div className={styles.logoMark} aria-hidden="true">
            <span className={styles.logoF}>F</span>
            <span className={styles.logoL}>L</span>
            <span className={styles.logoU}>U</span>
            <span className={styles.logoX}>X</span>
          </div>

          <h1 className={styles.title}>Log into Flux</h1>

          <p className={styles.subtitle}>
            Create communities, hang out in channels, and chat with your crew.
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
