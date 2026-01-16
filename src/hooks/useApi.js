'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for making API calls with loading and error states
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Error de conexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => execute(url, { method: 'GET' }), [execute]);

  const post = useCallback((url, body) => execute(url, {
    method: 'POST',
    body: JSON.stringify(body),
  }), [execute]);

  const put = useCallback((url, body) => execute(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  }), [execute]);

  const del = useCallback((url) => execute(url, { method: 'DELETE' }), [execute]);

  return {
    loading,
    error,
    setError,
    execute,
    get,
    post,
    put,
    del,
  };
}

/**
 * Hook for handling form state and validation
 */
export function useForm(initialValues, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when value changes
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValue(name, type === 'checkbox' ? checked : value);
  }, [setValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name);
    validateField(name, values[name]);
  }, [values]);

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return true;

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        return false;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: null }));
    return true;
  }, [validationRules, values]);

  const validate = useCallback(() => {
    let isValid = true;
    const newErrors = {};

    Object.keys(validationRules).forEach((name) => {
      const rules = validationRules[name];
      for (const rule of rules) {
        const error = rule(values[name], values);
        if (error) {
          newErrors[name] = error;
          isValid = false;
          break;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValues,
    setValue,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).filter((k) => errors[k]).length === 0,
  };
}

// Common validation rules
export const validators = {
  required: (message = 'Este campo es obligatorio') => (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Minimo ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Maximo ${max} caracteres`;
    }
    return null;
  },

  email: (message = 'Email invalido') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },

  date: (message = 'Fecha invalida') => (value) => {
    if (value && isNaN(new Date(value).getTime())) {
      return message;
    }
    return null;
  },

  futureDate: (message = 'La fecha debe ser futura') => (value) => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return message;
      }
    }
    return null;
  },
};
