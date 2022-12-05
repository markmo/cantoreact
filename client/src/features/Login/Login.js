import { useNavigate } from 'react-router-dom';
import env from 'react-dotenv';
import useOAuth2 from './useOAuth2';

const Login = () => {

  const navigate = useNavigate();

  const { data, loading, error, getAuth } = useOAuth2({
    navigate,
    appId: env.APP_ID,
    authorizeUrl: env.AUTHORIZE_URL,
    redirectUrl: `${document.location.origin}/callback`,
    tokenUrl: `/token`,
  });

  const isLoggedIn = Boolean(data && data.access_token); // or whatever...

  if (error) {
    return <div>Error</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    return <pre>{JSON.stringify(data)}</pre>;
  }

  return (
    <button style={{ margin: '24px' }} type="button" onClick={() => getAuth()}>
      Login
    </button>
  );
};

export default Login;
