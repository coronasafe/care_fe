import { useCallback, useEffect } from "react";
import { AuthUserContext } from "../Common/hooks/useAuthUser";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { LocalStorageKeys } from "../Common/constants";
import request from "../Utils/request/request";
import useConfig from "../Common/hooks/useConfig";
import { navigate } from "raviger";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
}

export default function AuthUserProvider({ children, unauthorized }: Props) {
  const { jwt_token_refresh_interval } = useConfig();
  const tokenRefreshInterval = jwt_token_refresh_interval ?? 5 * 60 * 1000;

  const {
    res,
    data: user,
    loading,
    refetch,
  } = useQuery(routes.currentUser, { silent: true });

  useEffect(() => {
    if (!user) {
      return;
    }

    updateRefreshToken(true);
    setInterval(() => updateRefreshToken(), tokenRefreshInterval);
  }, [user, tokenRefreshInterval]);

  const signIn = useCallback(
    async (creds: { username: string; password: string }) => {
      const query = await request(routes.login, { body: creds });

      if (query.res?.ok && query.data) {
        localStorage.setItem(LocalStorageKeys.accessToken, query.data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, query.data.refresh);

        await refetch();
      }

      return query;
    },
    [refetch]
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);

    await refetch();
    navigate(getRedirectOr("/"));
  }, [refetch]);

  // Handles signout from current tab, if signed out from another tab.
  useEffect(() => {
    const listener = (event: any) => {
      if (
        !event.newValue &&
        (LocalStorageKeys.accessToken === event.key ||
          LocalStorageKeys.refreshToken === event.key)
      ) {
        signOut();
      }
    };

    addEventListener("storage", listener);

    return () => {
      removeEventListener("storage", listener);
    };
  }, [signOut]);

  if (loading || !res) {
    return <Loading />;
  }

  return (
    <AuthUserContext.Provider value={{ signIn, signOut, user }}>
      {!res.ok || !user ? unauthorized : children}
    </AuthUserContext.Provider>
  );
}

const updateRefreshToken = async (silent = false) => {
  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  if (!refresh) {
    return;
  }

  const { res, data } = await request(routes.token_refresh, {
    body: { refresh },
    silent,
  });

  if (res?.status !== 200 || !data) {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    return;
  }

  localStorage.setItem(LocalStorageKeys.accessToken, data.access);
  localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
};

const getRedirectOr = (fallback: string) => {
  const url = window.location.href;
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect) {
    const r = new URL(redirect);
    if (r.origin == window.location.origin) {
      return redirect;
    } else {
      return fallback;
    }
  }
  if (
    url == `${window.location.origin}/login` ||
    url == window.location.origin ||
    url == `${window.location.origin}/session-expired`
  ) {
    return fallback;
  } else {
    return url;
  }
};
