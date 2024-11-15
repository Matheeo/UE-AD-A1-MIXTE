import React, { useEffect, useState } from "react";
import InfoIcon from '@mui/icons-material/Info';
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
    Button, Select, IconButton,
} from "@mui/material";
import { useSpring, animated } from "@react-spring/web";

const UserList = () => {

    // State variables
    const [userData, setUserData] = useState([]); // Array of users
    const [userid, setUserid] = useState(""); // Selected user id
    const [userNbMovies, setUserNbMovies] = useState(0); // Number of movies watched by the user selected
    const [userMoviesTitlesBooked, setUserMoviesTitlesBooked] = useState([]); // Array of movies booked by the user selected
    const [requestMoviesTitleIsDone, setRequestMoviesTitleIsDone] = useState(true); // Boolean to check if the request for movies titles is done
    const [openDialog, setOpenDialog] = useState(false); // Boolean to open the dialog
    const [selectedMovie, setSelectedMovie] = useState(null); // Selected movie

    // Animation
    const springs = useSpring({
        from: { number: 0 },
        to: { number: userNbMovies },
        config: { duration: 1000 },
    });

    // Media query
    const isMobile = useMediaQuery('(max-width:600px)');

    // Fetch user details
    const fetchUserDetails = async (userid) => {

        // Fetch user watched count
        try {
            const response = await fetch(`http://localhost:3203/users/${userid}/movies/watched-count`);
            const data = await response.json();
            setUserNbMovies(data["watched-count"]);
        } catch (error) {
            console.error("Error fetching user watched count:", error);
        }

        // Fetch user watched movies
        try {

            // set the requestMoviesTitleIsDone to false to show the loading message
            setRequestMoviesTitleIsDone(false);

            const response = await fetch(`http://localhost:3203/users/${userid}/movies/titles`);
            const data = await response.json();
            setUserMoviesTitlesBooked(data.titles);

            // set the requestMoviesTitleIsDone to true to show the movies list
            setRequestMoviesTitleIsDone(true);

        } catch (error) {

            // set the requestMoviesTitleIsDone to true to show the movies list
            setRequestMoviesTitleIsDone(true);

            console.error("Error fetching user watched movies:", error);
        }
    };

    // Fetch movie details
    const fetchMovieDetails = async (movieId) => {
        try {
            const response = await fetch(`http://localhost:3001/graphql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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

    // Handle movie click event for the dialog popup
    const handleMovieClick = (movie) => {
        setOpenDialog(true);
        fetchMovieDetails(movie.id);
    };

    // Handle close dialog event for the dialog popup
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedMovie(null);
    };

    // Fetch users at the beginning
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
        <div>
            <Typography variant="h3" gutterBottom sx={{ mt: "3%", mb: "4%" }}>
                Gestion des utilisateurs
            </Typography>
            <FormControl sx={{ width: "85%", mx: "3%" }}>
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
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        mt: 3,
                        mb: 4,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: isMobile ? 3 : 0,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Nombre de films regardés :
                        </Typography>
                        <animated.div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {springs.number.to((val) => Math.floor(val))}
                        </animated.div>
                    </Box>

                    <Box sx={{ width: isMobile ? '100%' : '60%' }}>
                        <Typography variant="h6" gutterBottom align={isMobile ? 'center' : 'left'}>
                            Liste des films regardés ou réservés
                        </Typography>

                        {userMoviesTitlesBooked.length > 0 ? (
                            <TableContainer component={Paper} sx={{ width: '100%', mt: 2 }}>
                                <Table>
                                    <TableBody>
                                        {userMoviesTitlesBooked.map((movie) => (
                                            <TableRow key={movie.id}>
                                                <TableCell align="center">{movie.title}</TableCell>
                                                <TableCell align="center">
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
                            <Typography variant="h7" align="center" sx={{ mt: 4 }}>
                                Aucun film réservé.
                            </Typography>
                        ) : (
                            <Typography variant="h7" align="center" sx={{ mt: 4 }}>
                                Chargement en cours...
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* Popup Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
                <DialogTitle>Détails du film</DialogTitle>
                <DialogContent>
                    {selectedMovie ? (
                        <Box>
                            <Typography variant="h6">Titre : {selectedMovie.title}</Typography>
                            <Typography variant="body1">Note : {selectedMovie.rating}</Typography>
                            <Typography variant="body2">Directeur : {selectedMovie.director}</Typography>
                        </Box>
                    ) : (
                        <Typography>Chargement...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default UserList;
