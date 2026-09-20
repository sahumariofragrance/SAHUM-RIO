import React, { useState, useCallback, useEffect } from 'react';
import { Input, Select, Textarea } from './ui';
import { STATES } from '../constants/checkout';

const ShippingForm = React.memo(({ onFormChange, initialValues = {}, requireEmail = false }) => {
  const [form, setForm] = useState(() => ({ state: 'Maharashtra', ...initialValues }));
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) newErrors.name = 'Name is required';
        else delete newErrors.name;
        break;
      case 'phone':
        if (!value || !/^\d{10}$/.test(value.replace(/\D/g, ''))) 
          newErrors.phone = 'Valid 10-digit phone required';
        else delete newErrors.phone;
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          newErrors.email = 'Valid email required';
        else delete newErrors.email;
        break;
      case 'address':
        if (!value.trim()) newErrors.address = 'Address is required';
        else delete newErrors.address;
        break;
      case 'city':
        if (!value.trim()) newErrors.city = 'City is required';
        else delete newErrors.city;
        break;
      case 'pin':
        if (!value || !/^\d{6}$/.test(value)) 
          newErrors.pin = 'Valid 6-digit PIN required';
        else delete newErrors.pin;
        break;
      default:
        break;
    }
    
    return newErrors;
  }, [errors]);

  const isValid = useCallback((values, currentErrors) => {
    const phone = String(values.phone || '').replace(/\D/g, '');
    const email = String(values.email || '').trim();
    return (
      !Object.keys(currentErrors).length &&
      Boolean(String(values.name || '').trim()) &&
      /^\d{10}$/.test(phone) &&
      (requireEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) &&
      Boolean(String(values.address || '').trim()) &&
      Boolean(String(values.city || '').trim()) &&
      Boolean(String(values.state || '').trim()) &&
      /^\d{6}$/.test(String(values.pin || ''))
    );
  }, [requireEmail]);

  useEffect(() => {
    onFormChange(form, isValid(form, errors));
  }, [form, errors, isValid, onFormChange]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(validateField(name, value));
  }, [validateField]);

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          name="name"
          label="Full Name"
          required
          value={form.name || ''}
          onChange={handleChange}
          error={errors.name}
          placeholder="John Doe"
        />
        <Input
          name="phone"
          label="Phone"
          required
          value={form.phone || ''}
          onChange={handleChange}
          error={errors.phone}
          placeholder="10-digit mobile"
        />
      </div>

      <Input
        name="email"
        label={requireEmail ? "Email" : "Email (optional)"}
        type="email"
        required={requireEmail}
        value={form.email || ''}
        onChange={handleChange}
        error={errors.email}
        placeholder="you@example.com"
      />

      <Textarea
        name="address"
        label="Address"
        required
        value={form.address || ''}
        onChange={handleChange}
        error={errors.address}
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          name="city"
          label="City"
          required
          value={form.city || ''}
          onChange={handleChange}
          error={errors.city}
        />
        <Select
          name="state"
          label="State"
          required
          value={form.state || 'Maharashtra'}
          onChange={handleChange}
          options={STATES.map(s => ({ value: s, label: s }))}
        />
        <Input
          name="pin"
          label="PIN Code"
          required
          value={form.pin || ''}
          onChange={handleChange}
          error={errors.pin}
          placeholder="6-digit PIN"
        />
      </div>

    </form>
  );
});

ShippingForm.displayName = 'ShippingForm';

export default ShippingForm;
