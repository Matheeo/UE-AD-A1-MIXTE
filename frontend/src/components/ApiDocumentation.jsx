import React, { useState, useEffect } from "react";
import axios from "axios";

const ApiDocumentation = () => {
    const [endpoints, setEndpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEndpoints = async () => {
            try {
                const response = await axios.post(
                    "http://localhost:3001/graphql", // URL du point GraphQL
                    {
                        query: `
                          query {
                            help {
                              name
                              description
                              type
                              arguments {
                                name
                                type
                              }
                            }
                          }
                        `,
                    }
                );

                // Accéder à la réponse GraphQL correctement
                setEndpoints(response.data.data.help || []);
                setLoading(false);
            } catch (err) {
                setError("Erreur lors du chargement de la documentation.");
                setLoading(false);
            }
        };

        fetchEndpoints();
    }, []);

    if (loading) {
        return <p>Chargement de la documentation...</p>;
    }

    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Movies API Documentation</h1>
            {endpoints.length === 0 ? (
                <p>Aucun endpoint disponible.</p>
            ) : (
                <ul style={styles.list}>
                    {endpoints.map((endpoint, index) => (
                        <li key={index} style={styles.listItem}>
                            <div style={styles.route}>
                                <strong>{endpoint.name}</strong> ({endpoint.type})
                            </div>
                            <div style={styles.detail}>{endpoint.description || "No description available"}</div>
                            {endpoint.arguments.length > 0 && (
                                <div style={styles.arguments}>
                                    <strong>Arguments:</strong>
                                    <ul style={styles.argumentList}>
                                        {endpoint.arguments.map((arg, i) => (
                                            <li key={i} style={styles.argumentItem}>
                                                {arg.name} (<em>{arg.type}</em>)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Styles en JS
const styles = {
    container: {
        fontFamily: "Arial, sans-serif",
        margin: "20px auto",
        maxWidth: "800px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
    },
    header: {
        fontSize: "24px",
        textAlign: "center",
        marginBottom: "20px",
        color: "#333",
    },
    list: {
        listStyleType: "none",
        padding: "0",
    },
    listItem: {
        marginBottom: "15px",
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        backgroundColor: "#fff",
    },
    route: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#007bff",
    },
    detail: {
        fontSize: "14px",
        color: "#555",
        marginTop: "5px",
    },
    arguments: {
        marginTop: "10px",
        color: "#444",
    },
    argumentList: {
        listStyleType: "none",
        padding: "0",
    },
    argumentItem: {
        marginBottom: "5px",
    },
};

export default ApiDocumentation;
