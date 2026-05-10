declare module './api' {
  import { AxiosInstance } from 'axios';
  const api: AxiosInstance;
  export default api;
}

declare module '../services/api' {
  import { AxiosInstance } from 'axios';
  const api: AxiosInstance;
  export default api;
}

declare module '../../services/api' {
  import { AxiosInstance } from 'axios';
  const api: AxiosInstance;
  export default api;
}
