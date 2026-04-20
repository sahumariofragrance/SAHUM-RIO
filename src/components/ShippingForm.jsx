import React, { useState, useCallback } from 'react';
import { Input, Select, Textarea } from './ui';
import { STATES } from '../constants/checkout';

const ShippingForm = React.memo(({ onFormChange, initialValues = {} }) => {
  const [form, setForm] = useState(initialValues);
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
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      const newErrors = validateField(name, value);
      setErrors(newErrors);
      const valid =
        !Object.keys(newErrors).length &&
        !!(newForm.name && newForm.phone && newForm.email && newForm.address && newForm.city && newForm.state && newForm.pin);
      onFormChange(newForm, valid);
      return newForm;
    });
  }, [onFormChange, validateField]);

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
        label="Email"
        type="email"
        required
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

      <Textarea
        name="notes"
        label="Order Notes (optional)"
        value={form.notes || ''}
        onChange={handleChange}
        rows={2}
      />
    </form>
  );
});

ShippingForm.displayName = 'ShippingForm';

export default ShippingForm;
