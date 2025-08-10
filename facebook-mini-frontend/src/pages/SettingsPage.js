import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, Lock, Bell, EyeOff, HelpCircle, LogOut } from 'lucide-react';
import './settings.css';

const SettingsPage = () => {
  // Données de configuration simulées
  const settingsCategories = [
    {
      title: "Compte",
      icon: <User size={20} />,
      items: [
        { name: "Informations personnelles", path: "/settings/profile" },
        { name: "Confidentialité", path: "/settings/privacy" },
        { name: "Sécurité", path: "/settings/security" }
      ]
    },
    {
      title: "Notifications",
      icon: <Bell size={20} />,
      items: [
        { name: "Paramètres de notification", path: "/settings/notifications" },
        { name: "Email et SMS", path: "/settings/emails" }
      ]
    },
    {
      title: "Confidentialité",
      icon: <Lock size={20} />,
      items: [
        { name: "Qui peut voir vos publications", path: "/settings/audience" },
        { name: "Bloquer des utilisateurs", path: "/settings/blocked" }
      ]
    },
    {
      title: "Accessibilité",
      icon: <EyeOff size={20} />,
      items: [
        { name: "Mode sombre", path: "/settings/dark-mode" },
        { name: "Taille du texte", path: "/settings/text-size" }
      ]
    }
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1><Settings size={24} /> Paramètres</h1>
        <p>Gérez vos préférences et vos informations de compte</p>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          {settingsCategories.map((category, index) => (
            <div key={index} className="settings-category">
              <h3>{category.icon} {category.title}</h3>
              <ul>
                {category.items.map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="settings-link">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="settings-main-content">
          <div className="settings-card">
            <h2>Paramètres généraux</h2>
            <div className="settings-option">
              <label>Langue</label>
              <select>
                <option>Français</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </div>
            <div className="settings-option">
              <label>Mode sombre</label>
              <label className="switch">
                <input type="checkbox" />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="settings-card">
            <h2>Confidentialité</h2>
            <div className="settings-option">
              <label>Qui peut voir vos futures publications ?</label>
              <select>
                <option>Public</option>
                <option>Amis</option>
                <option>Amis sauf...</option>
                <option>Personnalisé</option>
              </select>
            </div>
          </div>

          <div className="settings-card danger-zone">
            <h2>Zone sensible</h2>
            <button className="danger-button">
              <HelpCircle size={18} /> Centre d'aide
            </button>
            <button className="danger-button">
              <LogOut size={18} /> Déconnexion
            </button>
            <button className="danger-button delete-account">
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;