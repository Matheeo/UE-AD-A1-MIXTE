import React, { useEffect, useState } from "react";
import InfoIcon from "@mui/icons-material/Info";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Select,
    IconButton,
    CircularProgress,
} from "@mui/material";
import { useSpring, animated } from "@react-spring/web";

const UserList = () => {
    const [userData, setUserData] = useState([]);
    const [userid, setUserid] = useState("");
    const [userNbMovies, setUserNbMovies] = useState(0);
    const [userMoviesTitlesBooked, setUserMoviesTitlesBooked] = useState([]);
    const [requestMoviesTitleIsDone, setRequestMoviesTitleIsDone] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);

    const springs = useSpring({
        from: { number: 0 },
        to: { number: userNbMovies },
        config: { duration: 1000 },
    });

    const isMobile = useMediaQuery("(max-width:600px)");

    const fetchUserDetails = async (userid) => {
        try {
            const response = await fetch(`http://localhost:3203/users/${userid}/movies/watched-count`);
            const data = await response.json();
            setUserNbMovies(data["watched-count"]);
        } catch (error) {
            console.error("Error fetching user watched count:", error);
        }

        try {
            setRequestMoviesTitleIsDone(false);
            const response = await fetch(`http://localhost:3203/users/${userid}/movies/titles`);
            const data = await response.json();
            setUserMoviesTitlesBooked(data.titles);
            setRequestMoviesTitleIsDone(true);
        } catch (error) {
            setRequestMoviesTitleIsDone(true);
            console.error("Error fetching user watched movies:", error);
        }
    };

    const fetchMovieDetails = async (movieId) => {
        try {
            const response = await fetch(`http://localhost:3001/graphql`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `query { movie_by_id(id: "${movieId}") { title rating director id } }`,
                }),
            });
            const { data } = await response.json();
            setSelectedMovie(data.movie_by_id);
        } catch (error) {
            console.error("Error fetching movie details:", error);
        }
    };

    const handleMovieClick = (movie) => {
        setOpenDialog(true);
        fetchMovieDetails(movie.id);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedMovie(null);
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:3203/users");
                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUser();
    }, []);

    return (
        <Box sx={{ padding: "2rem", backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
            <Typography
                variant="h3"
                gutterBottom
                sx={{ textAlign: "center", color: "#333", marginBottom: "2rem" }}
            >
                Gestion des Utilisateurs
            </Typography>
            <FormControl fullWidth sx={{ maxWidth: "500px", margin: "0 auto", marginBottom: "2rem" }}>
                <InputLabel id="select-label">Choisissez une personne</InputLabel>
                <Select
                    labelId="select-user"
                    value={userid}
                    onChange={(e) => {
                        setUserid(e.target.value);
                        if (e.target.value) {
                            setUserNbMovies(0);
                            setUserMoviesTitlesBooked([]);
                            fetchUserDetails(e.target.value);
                        }
                    }}
                    label="Choisissez un utilisateur"
                >
                    {userData.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                            {user.name}
                        </MenuItem>
                    ))}
                    {userData.length === 0 && (
                        <MenuItem disabled>
                            Erreur lors du chargement des utilisateurs ou aucun utilisateur trouvé
                        </MenuItem>
                    )}
                    {userData.length > 0 && <MenuItem value={""}>Aucun</MenuItem>}
                </Select>
            </FormControl>

            {userid && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "2rem",
                    }}
                >
                    <Box
                        sx={{
                            textAlign: "center",
                            padding: "1rem",
                            backgroundColor: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Nombre de films regardés :
                        </Typography>
                        <animated.div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                            {springs.number.to((val) => Math.floor(val))}
                        </animated.div>
                    </Box>

                    <Box sx={{ width: isMobile ? "100%" : "60%", marginTop: isMobile ? "2rem" : "0" }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ textAlign: isMobile ? "center" : "left", marginBottom: "1rem" }}
                        >
                            Liste des films regardés ou réservés
                        </Typography>

                        {userMoviesTitlesBooked.length > 0 ? (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableBody>
                                        {userMoviesTitlesBooked.map((movie) => (
                                            <TableRow key={movie.id} hover>
                                                <TableCell align="left">{movie.title}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton onClick={() => handleMovieClick(movie)}>
                                                        <InfoIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : requestMoviesTitleIsDone ? (
                            <Typography variant="body1" align="center" sx={{ marginTop: "2rem" }}>
                                Aucun film réservé.
                            </Typography>
                        ) : (
                            <CircularProgress sx={{ display: "block", margin: "2rem auto" }} />
                        )}
                    </Box>
                </Box>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
                <DialogTitle>Détails du Film</DialogTitle>
                <DialogContent>
                    {selectedMovie ? (
                        <Box>
                            <Typography variant="h6">Titre : {selectedMovie.title}</Typography>
                            <Typography variant="body1">Note : {selectedMovie.rating}</Typography>
                            <Typography variant="body2">Directeur : {selectedMovie.director}</Typography>
                        </Box>
                    ) : (
                        <CircularProgress sx={{ display: "block", margin: "1rem auto" }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserList;
