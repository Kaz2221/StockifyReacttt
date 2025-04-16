import React, { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    profile_picture: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Générer une URL temporaire pour prévisualiser l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ 
          ...prev, 
          profile_picture: reader.result 
        }));
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Inscription réussie! 🎉");
        setFormData({ 
          email: "", 
          password: "", 
          phone_number: "",
          first_name: "",
          last_name: "",
          profile_picture: "" 
        });
        setPreviewImage(null);
      } else {
        setError(data.message || "Quelque chose s'est mal passé");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Erreur serveur. Réessayez plus tard.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Créer un compte</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Adresse email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label>Prénom</label>
              <input
                type="text"
                name="first_name"
                placeholder="Prénom"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group half-width">
              <label>Nom</label>
              <input
                type="text"
                name="last_name"
                placeholder="Nom"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Numéro de téléphone</label>
            <input
              type="text"
              name="phone_number"
              placeholder="Numéro de téléphone"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Photo de profil</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {previewImage && (
              <div className="image-preview">
                <img 
                  src={previewImage} 
                  alt="Aperçu de la photo de profil" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    borderRadius: '50%' 
                  }} 
                />
              </div>
            )}
          </div>

          <button type="submit" className="register-button">
            S'inscrire
          </button>
        </form>

        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
};

export default Register;