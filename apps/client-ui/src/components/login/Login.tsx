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

  const handleLoginSuccess = async (response: any) => {
    try {
      const decodedToken: ICredentials = jwtDecode(response?.credential);
      
      console.log("🔐 Login successful:", decodedToken.given_name);
      setCredentials(decodedToken);

      const addUserService = new AddUserService();
      await addUserService.addUser(decodedToken);
      
      console.log("✅ User added to database");
    } catch (error) {
      console.error("❌ Login error:", error);
    }
  };

  const handleLoginFailure = () => {
    console.error("❌ Google Login Failed");
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
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {/* TODO: Update this message based on your setup */}
          Make sure your backend server is running on port 8000
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
