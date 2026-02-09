'use client';
import { useState } from 'react';
import { useForm } from '@formspree/react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [state, handleSubmit] = useForm("mgokvlpj");
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = {
    name: formData.name.length < 3 ? "Proszę podać imię i nazwisko." : '',
    email: !emailRegex.test(formData.email) ? "Proszę podać poprawny adres e-mail." : '',
    message: formData.message.length < 10 ? "Wiadomość powinna mieć min. 10 znaków." : ''
  };

  const isFormValid = !errors.name && !errors.email && !errors.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  if (state.succeeded) {
    return (
      <div className={styles.successContainer}>
        <p className={styles.successMessage}>Wiadomość została wysłana!</p>
        <button onClick={() => window.location.reload()} className={styles.submitBtn}>
          Wyślij kolejną wiadomość
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label htmlFor="name">Imię i Nazwisko</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.name && errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
        </div>

        <div className={styles.group}>
          <label htmlFor="email">Adres E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.email && errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
        </div>

        <div className={styles.group}>
          <label htmlFor="message">Wiadomość</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.textarea}
          ></textarea>
          {touched.message && errors.message && <div className={styles.errorMessage}>{errors.message}</div>}
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${!isFormValid ? styles.disabledBtn : ''}`}
          disabled={!isFormValid || state.submitting}
        >
          {state.submitting ? "Wysyłanie..." : "Wyślij wiadomość"}
        </button>
      </form>
    </div>
  );
}