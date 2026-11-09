import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import api from './api';

const toBase64Url = (value) => btoa(JSON.stringify(value)).replaceAll('=', '');
const tokenExpiringIn = (seconds) =>
  `${toBase64Url({ alg: 'none' })}.${toBase64Url({ exp: Math.floor(Date.now() / 1000) + seconds })}.signature`;

function respondWith(status) {
  return vi.fn((config) => {
    if (status < 400) return Promise.resolve({ data: { ok: true }, status, statusText: 'OK', headers: {}, config });
    const error = new axios.AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, null, {
      status,
      data: {},
      headers: {},
      config,
    });
    return Promise.reject(error);
  });
}

function signIn() {
  localStorage.setItem('user', JSON.stringify({ id: 1, role: 'Staff' }));
  localStorage.setItem('access_token', tokenExpiringIn(600));
  localStorage.setItem('refresh_token', tokenExpiringIn(3600));
}

afterEach(() => {
  api.defaults.adapter = undefined;
});

describe('api client', () => {
  it('passes server errors other than 401 straight through', async () => {
    signIn();
    api.defaults.adapter = respondWith(500);

    await expect(api.get('/appointments/my/')).rejects.toMatchObject({ response: { status: 500 } });
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  it('cancels requests once the session can no longer be resumed', async () => {
    signIn();
    localStorage.setItem('refresh_token', tokenExpiringIn(-60));
    const adapter = respondWith(200);
    api.defaults.adapter = adapter;

    const result = api.get('/appointments/my/');

    await expect(result).rejects.toBeInstanceOf(axios.Cancel);
    expect(adapter).not.toHaveBeenCalled();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('rejects a 401 without trying to refresh when there is no refresh token', async () => {
    const adapter = respondWith(401);
    api.defaults.adapter = adapter;
    const post = vi.spyOn(axios, 'post');

    await expect(api.get('/appointments/my/')).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects with the refresh error and logs out when the refresh token is refused', async () => {
    signIn();
    api.defaults.adapter = respondWith(401);
    const refusal = Object.assign(new Error('refresh refused'), { response: { status: 401 } });
    const post = vi.spyOn(axios, 'post').mockRejectedValue(refusal);

    await expect(api.get('/appointments/my/')).rejects.toBe(refusal);
    expect(post).toHaveBeenCalledWith(expect.stringContaining('/staff/token/refresh/'), { refresh: expect.any(String) });
    expect(localStorage.getItem('user')).toBeNull();
  });
});
