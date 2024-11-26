import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

if (CLIENT_ID) {
  console.log(CLIENT_ID);
}

const GoogleSignIn = () => {
  const onSuccess = (response: any) => {
    console.log(response);
    // Handle the response (e.g., send the token to your server)
  };

  const onError = () => {
    // Handle the error (e.g., show a message to the user)
  };
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div>
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleSignIn;
