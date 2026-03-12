--
-- PostgreSQL database dump
--

\restrict nQksirhxDzkssSHoLZvDVtETh2SHPOtbTprTRiKctMOC8fnb6L0o7wKa5nGmyi2

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attivita; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attivita (
    id integer NOT NULL,
    nastro_id text NOT NULL,
    id_punto_origine text NOT NULL,
    id_punto_destinazione text NOT NULL,
    orario_inizio_attivita text NOT NULL,
    orario_fine_attivita text NOT NULL,
    tipo_attivita text NOT NULL,
    id_corsa text,
    is_bridge_corsa boolean DEFAULT false
);


ALTER TABLE public.attivita OWNER TO postgres;

--
-- Name: attivita_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attivita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attivita_id_seq OWNER TO postgres;

--
-- Name: attivita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attivita_id_seq OWNED BY public.attivita.id;


--
-- Name: attivita_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attivita_snapshot (
    id integer NOT NULL,
    nastro_id text NOT NULL,
    id_punto_origine text NOT NULL,
    id_punto_destinazione text NOT NULL,
    orario_inizio_attivita text NOT NULL,
    orario_fine_attivita text NOT NULL,
    tipo_attivita text NOT NULL,
    id_corsa text,
    is_bridge_corsa boolean DEFAULT false
);


ALTER TABLE public.attivita_snapshot OWNER TO postgres;

--
-- Name: attivita_snapshot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attivita_snapshot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attivita_snapshot_id_seq OWNER TO postgres;

--
-- Name: attivita_snapshot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attivita_snapshot_id_seq OWNED BY public.attivita_snapshot.id;


--
-- Name: merge_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merge_log (
    id integer NOT NULL,
    tipo_operazione text NOT NULL,
    target_nastro_id text NOT NULL,
    source_nastro_id text NOT NULL,
    bridge_corsa_id text,
    eseguite_alle text NOT NULL
);


ALTER TABLE public.merge_log OWNER TO postgres;

--
-- Name: merge_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.merge_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merge_log_id_seq OWNER TO postgres;

--
-- Name: merge_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.merge_log_id_seq OWNED BY public.merge_log.id;


--
-- Name: transiti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transiti (
    id integer NOT NULL,
    id_corsa text NOT NULL,
    id_punto text NOT NULL,
    sequenza integer NOT NULL,
    orario_arrivo text,
    orario_partenza text,
    salita_discesa_passeggeri text
);


ALTER TABLE public.transiti OWNER TO postgres;

--
-- Name: transiti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transiti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transiti_id_seq OWNER TO postgres;

--
-- Name: transiti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transiti_id_seq OWNED BY public.transiti.id;


--
-- Name: attivita id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attivita ALTER COLUMN id SET DEFAULT nextval('public.attivita_id_seq'::regclass);


--
-- Name: attivita_snapshot id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attivita_snapshot ALTER COLUMN id SET DEFAULT nextval('public.attivita_snapshot_id_seq'::regclass);


--
-- Name: merge_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_log ALTER COLUMN id SET DEFAULT nextval('public.merge_log_id_seq'::regclass);


--
-- Name: transiti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transiti ALTER COLUMN id SET DEFAULT nextval('public.transiti_id_seq'::regclass);


--
-- Data for Name: attivita; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attivita (id, nastro_id, id_punto_origine, id_punto_destinazione, orario_inizio_attivita, orario_fine_attivita, tipo_attivita, id_corsa, is_bridge_corsa) FROM stdin;
5025	N00G0	Napoli	Napoli	2026-03-12T11:28:00.000Z	2026-03-12T11:58:00.000Z	tempo accessorio	\N	f
5026	N00G0	Napoli	Sarno	2026-03-12T11:58:00.000Z	2026-03-12T13:10:00.000Z	corsa in linea	6129	f
5027	N00G0	Sarno	Sarno	2026-03-12T13:10:00.000Z	2026-03-12T14:02:00.000Z	sosta	\N	f
5028	N00G0	Sarno	Napoli	2026-03-12T14:02:00.000Z	2026-03-12T15:15:00.000Z	corsa in linea	6150	f
5029	N00G0	Napoli	Napoli	2026-03-12T15:15:00.000Z	2026-03-12T15:34:00.000Z	sosta	\N	f
5030	N00G0	Napoli	Sarno	2026-03-12T15:34:00.000Z	2026-03-12T16:46:00.000Z	corsa in linea	6165	f
5031	N00G0	Sarno	Sarno	2026-03-12T16:46:00.000Z	2026-03-12T17:38:00.000Z	sosta	\N	f
5032	N00G0	Sarno	Napoli	2026-03-12T17:38:00.000Z	2026-03-12T18:51:00.000Z	corsa in linea	6186	f
5033	N00G0	Napoli	Napoli	2026-03-12T18:51:00.000Z	2026-03-12T19:11:00.000Z	tempo accessorio	\N	f
5034	N01G0	Napoli	Napoli	2026-03-12T13:20:00.000Z	2026-03-12T13:50:00.000Z	tempo accessorio	\N	f
5035	N01G0	Napoli	P.Marino	2026-03-12T13:50:00.000Z	2026-03-12T14:54:00.000Z	corsa in linea	4149	f
5036	N01G0	P.Marino	P.Marino	2026-03-12T14:54:00.000Z	2026-03-12T15:06:00.000Z	sosta	\N	f
5037	N01G0	P.Marino	Napoli	2026-03-12T15:06:00.000Z	2026-03-12T16:11:00.000Z	corsa in linea	4160	f
5039	N02G0	Baiano	Baiano	2026-03-12T14:33:00.000Z	2026-03-12T15:03:00.000Z	tempo accessorio	\N	f
5040	N02G0	Baiano	S.Giorgio	2026-03-12T15:03:00.000Z	2026-03-12T16:11:00.000Z	corsa in linea	8160	f
5041	N02G0	S.Giorgio	S.Giorgio	2026-03-12T16:11:00.000Z	2026-03-12T16:42:00.000Z	sosta	\N	f
5042	N02G0	S.Giorgio	Baiano	2026-03-12T16:42:00.000Z	2026-03-12T17:50:00.000Z	corsa in linea	8177	f
5045	N03G0	Sarno	Napoli	2026-03-12T07:26:00.000Z	2026-03-12T08:39:00.000Z	corsa in linea	6084	f
5046	N03G0	Napoli	Napoli	2026-03-12T08:39:00.000Z	2026-03-12T09:34:00.000Z	sosta	\N	f
5047	N03G0	Napoli	Sarno	2026-03-12T09:34:00.000Z	2026-03-12T10:46:00.000Z	corsa in linea	6105	f
5048	N03G0	Sarno	Sarno	2026-03-12T10:46:00.000Z	2026-03-12T11:06:00.000Z	tempo accessorio	\N	f
5050	N04G0	P.Marino	Napoli	2026-03-12T07:18:00.000Z	2026-03-12T08:23:00.000Z	corsa in linea	4082	f
5051	N04G0	Napoli	Napoli	2026-03-12T08:23:00.000Z	2026-03-12T10:14:00.000Z	sosta	\N	f
5052	N04G0	Napoli	P.Marino	2026-03-12T10:14:00.000Z	2026-03-12T11:18:00.000Z	corsa in linea	4113	f
5053	N04G0	P.Marino	P.Marino	2026-03-12T11:18:00.000Z	2026-03-12T11:38:00.000Z	tempo accessorio	\N	f
5055	N05G0	Sorrento	Napoli	2026-03-12T07:50:00.000Z	2026-03-12T09:01:00.000Z	corsa in linea	1088	f
5056	N05G0	Napoli	Napoli	2026-03-12T09:01:00.000Z	2026-03-12T10:05:00.000Z	sosta	\N	f
5057	N05G0	Napoli	Sorrento	2026-03-12T10:05:00.000Z	2026-03-12T11:17:00.000Z	corsa in linea	1111	f
5058	N05G0	Sorrento	Sorrento	2026-03-12T11:17:00.000Z	2026-03-12T11:37:00.000Z	tempo accessorio	\N	f
5059	N06G0	Baiano	Baiano	2026-03-12T06:09:00.000Z	2026-03-12T06:39:00.000Z	tempo accessorio	\N	f
5060	N06G0	Baiano	S.Giorgio	2026-03-12T06:39:00.000Z	2026-03-12T07:47:00.000Z	corsa in linea	8076	f
5061	N06G0	S.Giorgio	S.Giorgio	2026-03-12T07:47:00.000Z	2026-03-12T08:18:00.000Z	sosta	\N	f
5062	N06G0	S.Giorgio	Baiano	2026-03-12T08:18:00.000Z	2026-03-12T09:26:00.000Z	corsa in linea	8093	f
5063	N06G0	Baiano	Baiano	2026-03-12T09:26:00.000Z	2026-03-12T09:46:00.000Z	tempo accessorio	\N	f
5064	N07G0	Baiano	Baiano	2026-03-12T09:09:00.000Z	2026-03-12T09:39:00.000Z	tempo accessorio	\N	f
5065	N07G0	Baiano	S.Giorgio	2026-03-12T09:39:00.000Z	2026-03-12T10:47:00.000Z	corsa in linea	8106	f
5066	N07G0	S.Giorgio	S.Giorgio	2026-03-12T10:47:00.000Z	2026-03-12T13:42:00.000Z	sosta	\N	f
5067	N07G0	S.Giorgio	Baiano	2026-03-12T13:42:00.000Z	2026-03-12T14:50:00.000Z	corsa in linea	8147	f
5068	N07G0	Baiano	Baiano	2026-03-12T14:50:00.000Z	2026-03-12T15:10:00.000Z	tempo accessorio	\N	f
5069	N08G0	Napoli	Napoli	2026-03-12T11:32:00.000Z	2026-03-12T12:02:00.000Z	tempo accessorio	\N	f
5070	N08G0	Napoli	P.Marino	2026-03-12T12:02:00.000Z	2026-03-12T13:06:00.000Z	corsa in linea	4131	f
5071	N08G0	P.Marino	P.Marino	2026-03-12T13:06:00.000Z	2026-03-12T13:54:00.000Z	sosta	\N	f
5072	N08G0	P.Marino	Napoli	2026-03-12T13:54:00.000Z	2026-03-12T14:58:00.000Z	corsa in linea	4148	f
5073	N08G0	Napoli	Napoli	2026-03-12T14:58:00.000Z	2026-03-12T15:38:00.000Z	sosta	\N	f
5074	N08G0	Napoli	P.Marino	2026-03-12T15:38:00.000Z	2026-03-12T16:42:00.000Z	corsa in linea	4167	f
5075	N08G0	P.Marino	P.Marino	2026-03-12T16:42:00.000Z	2026-03-12T17:30:00.000Z	sosta	\N	f
5076	N08G0	P.Marino	Napoli	2026-03-12T17:30:00.000Z	2026-03-12T18:35:00.000Z	corsa in linea	4184	f
5077	N08G0	Napoli	Napoli	2026-03-12T18:35:00.000Z	2026-03-12T18:55:00.000Z	tempo accessorio	\N	f
5078	N09G0	P.Marino	P.Marino	2026-03-12T11:36:00.000Z	2026-03-12T12:06:00.000Z	tempo accessorio	\N	f
5192	N19G0	Napoli	Napoli	2026-03-12T04:25:00.000Z	2026-03-12T04:55:00.000Z	tempo accessorio	\N	f
5209	N14G0	Napoli	Napoli	2026-03-12T12:44:00.000Z	2026-03-12T13:14:00.000Z	tempo accessorio	\N	f
5193	N19G0	Napoli	Baiano	2026-03-12T04:55:00.000Z	2026-03-12T06:25:00.000Z	corsa in linea	80555	f
5210	N14G0	Napoli	P.Marino	2026-03-12T13:14:00.000Z	2026-03-12T14:18:00.000Z	corsa in linea	4143	f
5211	N14G0	P.Marino	Napoli	2026-03-12T14:30:00.000Z	2026-03-12T15:34:00.000Z	corsa di spostamento	4154	f
5079	N09G0	P.Marino	Napoli	2026-03-12T12:06:00.000Z	2026-03-12T13:11:00.000Z	corsa in linea	4130	f
5194	N02G0	Baiano	Napoli	2026-03-12T19:17:00.000Z	2026-03-12T20:39:00.000Z	corsa in linea	82016	f
5195	N02G0	Napoli	Napoli	2026-03-12T20:39:00.000Z	2026-03-12T20:59:00.000Z	tempo accessorio	\N	f
5081	N09G0	Napoli	P.Marino	2026-03-12T16:50:00.000Z	2026-03-12T17:52:00.000Z	corsa in linea	417900	f
5082	N09G0	P.Marino	P.Marino	2026-03-12T17:52:00.000Z	2026-03-12T18:12:00.000Z	tempo accessorio	\N	f
5083	N10G0	Napoli	Napoli	2026-03-12T13:52:00.000Z	2026-03-12T14:22:00.000Z	tempo accessorio	\N	f
5084	N10G0	Napoli	Sarno	2026-03-12T14:22:00.000Z	2026-03-12T15:34:00.000Z	corsa in linea	6153	f
5085	N10G0	Sarno	Sarno	2026-03-12T15:34:00.000Z	2026-03-12T16:26:00.000Z	sosta	\N	f
5086	N10G0	Sarno	Napoli	2026-03-12T16:26:00.000Z	2026-03-12T17:39:00.000Z	corsa in linea	6174	f
5087	N10G0	Napoli	Napoli	2026-03-12T17:39:00.000Z	2026-03-12T17:53:00.000Z	sosta	\N	f
5088	N10G0	Napoli	Sorrento	2026-03-12T17:53:00.000Z	2026-03-12T19:06:00.000Z	corsa in linea	1189	f
5089	N10G0	Sorrento	Sorrento	2026-03-12T19:06:00.000Z	2026-03-12T19:50:00.000Z	sosta	\N	f
5090	N10G0	Sorrento	Napoli	2026-03-12T19:50:00.000Z	2026-03-12T21:02:00.000Z	corsa in linea	1208	f
5091	N10G0	Napoli	Napoli	2026-03-12T21:02:00.000Z	2026-03-12T21:22:00.000Z	tempo accessorio	\N	f
5092	N11G0	Napoli	Napoli	2026-03-12T05:32:00.000Z	2026-03-12T06:02:00.000Z	tempo accessorio	\N	f
5093	N11G0	Napoli	P.Marino	2026-03-12T06:02:00.000Z	2026-03-12T07:06:00.000Z	corsa in linea	4071	f
5094	N11G0	P.Marino	P.Marino	2026-03-12T07:06:00.000Z	2026-03-12T07:54:00.000Z	sosta	\N	f
5095	N11G0	P.Marino	Napoli	2026-03-12T07:54:00.000Z	2026-03-12T08:58:00.000Z	corsa in linea	4088	f
5096	N11G0	Napoli	Napoli	2026-03-12T08:58:00.000Z	2026-03-12T10:22:00.000Z	sosta	\N	f
5097	N11G0	Napoli	Sorrento	2026-03-12T10:22:00.000Z	2026-03-12T11:36:00.000Z	corsa in linea	11121	f
5098	N11G0	Sorrento	Sorrento	2026-03-12T11:36:00.000Z	2026-03-12T12:02:00.000Z	sosta	\N	f
5099	N11G0	Sorrento	Napoli	2026-03-12T12:02:00.000Z	2026-03-12T13:14:00.000Z	corsa in linea	1130	f
5100	N11G0	Napoli	Napoli	2026-03-12T13:14:00.000Z	2026-03-12T13:34:00.000Z	tempo accessorio	\N	f
5101	N12G0	Baiano	Baiano	2026-03-12T11:33:00.000Z	2026-03-12T12:03:00.000Z	tempo accessorio	\N	f
5102	N12G0	Baiano	S.Giorgio	2026-03-12T12:03:00.000Z	2026-03-12T13:11:00.000Z	corsa in linea	8130	f
5103	N12G0	S.Giorgio	S.Giorgio	2026-03-12T13:11:00.000Z	2026-03-12T17:54:00.000Z	sosta	\N	f
5104	N12G0	S.Giorgio	Baiano	2026-03-12T17:54:00.000Z	2026-03-12T19:02:00.000Z	corsa in linea	8189	f
5105	N12G0	Baiano	Baiano	2026-03-12T19:02:00.000Z	2026-03-12T19:22:00.000Z	tempo accessorio	\N	f
5107	N13G0	Baiano	S.Giorgio	2026-03-12T07:15:00.000Z	2026-03-12T08:23:00.000Z	corsa in linea	8082	f
5108	N13G0	S.Giorgio	S.Giorgio	2026-03-12T08:23:00.000Z	2026-03-12T08:54:00.000Z	sosta	\N	f
5109	N13G0	S.Giorgio	Baiano	2026-03-12T08:54:00.000Z	2026-03-12T10:02:00.000Z	corsa in linea	8099	f
5112	N14G0	Napoli	Sarno	2026-03-12T16:10:00.000Z	2026-03-12T17:22:00.000Z	corsa in linea	6171	f
5113	N14G0	Sarno	Sarno	2026-03-12T17:22:00.000Z	2026-03-12T18:14:00.000Z	sosta	\N	f
5114	N14G0	Sarno	Napoli	2026-03-12T18:14:00.000Z	2026-03-12T19:27:00.000Z	corsa in linea	6192	f
5115	N14G0	Napoli	Napoli	2026-03-12T19:27:00.000Z	2026-03-12T19:47:00.000Z	tempo accessorio	\N	f
5116	N15G0	Sarno	Sarno	2026-03-12T11:08:00.000Z	2026-03-12T11:38:00.000Z	tempo accessorio	\N	f
5117	N15G0	Sarno	Napoli	2026-03-12T11:38:00.000Z	2026-03-12T12:51:00.000Z	corsa in linea	6126	f
5118	N15G0	Napoli	Napoli	2026-03-12T12:51:00.000Z	2026-03-12T13:46:00.000Z	sosta	\N	f
5119	N15G0	Napoli	Sarno	2026-03-12T13:46:00.000Z	2026-03-12T14:58:00.000Z	corsa in linea	6147	f
5120	N15G0	Sarno	Sarno	2026-03-12T14:58:00.000Z	2026-03-12T15:50:00.000Z	sosta	\N	f
5121	N15G0	Sarno	Napoli	2026-03-12T15:50:00.000Z	2026-03-12T17:03:00.000Z	corsa in linea	6168	f
5122	N15G0	Napoli	Napoli	2026-03-12T17:03:00.000Z	2026-03-12T17:22:00.000Z	sosta	\N	f
5123	N15G0	Napoli	Sarno	2026-03-12T17:22:00.000Z	2026-03-12T18:34:00.000Z	corsa in linea	6183	f
5196	N01G0	Napoli	Sorrento	2026-03-12T17:17:00.000Z	2026-03-12T18:29:00.000Z	corsa di spostamento	1183	f
5124	N15G0	Sarno	Sarno	2026-03-12T18:34:00.000Z	2026-03-12T18:54:00.000Z	tempo accessorio	\N	f
5130	N17G0	Napoli	Napoli	2026-03-12T11:59:00.000Z	2026-03-12T12:29:00.000Z	tempo accessorio	\N	f
5131	N17G0	Napoli	Sorrento	2026-03-12T12:29:00.000Z	2026-03-12T13:41:00.000Z	corsa in linea	1135	f
5132	N17G0	Sorrento	Sorrento	2026-03-12T13:41:00.000Z	2026-03-12T14:26:00.000Z	sosta	\N	f
5133	N17G0	Sorrento	Napoli	2026-03-12T14:26:00.000Z	2026-03-12T15:38:00.000Z	corsa in linea	1154	f
5134	N17G0	Napoli	Napoli	2026-03-12T15:38:00.000Z	2026-03-12T16:05:00.000Z	sosta	\N	f
5135	N17G0	Napoli	Sorrento	2026-03-12T16:05:00.000Z	2026-03-12T17:17:00.000Z	corsa in linea	1171	f
5136	N17G0	Sorrento	Sorrento	2026-03-12T17:17:00.000Z	2026-03-12T18:02:00.000Z	sosta	\N	f
5137	N17G0	Sorrento	Napoli	2026-03-12T18:02:00.000Z	2026-03-12T19:14:00.000Z	corsa in linea	1190	f
5138	N17G0	Napoli	Napoli	2026-03-12T19:14:00.000Z	2026-03-12T19:34:00.000Z	tempo accessorio	\N	f
5139	N18G0	Napoli	Napoli	2026-03-12T17:59:00.000Z	2026-03-12T18:29:00.000Z	tempo accessorio	\N	f
5140	N18G0	Napoli	Sorrento	2026-03-12T18:29:00.000Z	2026-03-12T19:41:00.000Z	corsa in linea	1195	f
5141	N18G0	Sorrento	Sorrento	2026-03-12T19:41:00.000Z	2026-03-12T20:26:00.000Z	sosta	\N	f
5142	N18G0	Sorrento	Napoli	2026-03-12T20:26:00.000Z	2026-03-12T21:37:00.000Z	corsa in linea	1214	f
5143	N18G0	Napoli	Napoli	2026-03-12T21:37:00.000Z	2026-03-12T21:57:00.000Z	tempo accessorio	\N	f
5145	N19G0	Baiano	S.Giorgio	2026-03-12T07:51:00.000Z	2026-03-12T08:59:00.000Z	corsa in linea	8088	f
5146	N19G0	S.Giorgio	S.Giorgio	2026-03-12T08:59:00.000Z	2026-03-12T10:42:00.000Z	sosta	\N	f
5147	N19G0	S.Giorgio	Baiano	2026-03-12T10:42:00.000Z	2026-03-12T11:50:00.000Z	corsa in linea	8117	f
5148	N19G0	Baiano	Baiano	2026-03-12T11:50:00.000Z	2026-03-12T12:10:00.000Z	tempo accessorio	\N	f
5149	N20G0	Napoli	Napoli	2026-03-12T10:27:00.000Z	2026-03-12T10:57:00.000Z	tempo accessorio	\N	f
5150	N20G0	Napoli	T.Annunziata	2026-03-12T10:57:00.000Z	2026-03-12T11:35:00.000Z	corsa in linea	11157	f
5151	N20G0	T.Annunziata	T.Annunziata	2026-03-12T11:35:00.000Z	2026-03-12T11:45:00.000Z	sosta	\N	f
5152	N20G0	T.Annunziata	Napoli	2026-03-12T11:45:00.000Z	2026-03-12T12:23:00.000Z	corsa in linea	11244	f
5153	N20G0	Napoli	Napoli	2026-03-12T12:23:00.000Z	2026-03-12T12:38:00.000Z	sosta	\N	f
5154	N20G0	Napoli	P.Marino	2026-03-12T12:38:00.000Z	2026-03-12T13:42:00.000Z	corsa in linea	4137	f
5155	N20G0	P.Marino	P.Marino	2026-03-12T13:42:00.000Z	2026-03-12T14:30:00.000Z	sosta	\N	f
5156	N20G0	P.Marino	Napoli	2026-03-12T14:30:00.000Z	2026-03-12T15:35:00.000Z	corsa in linea	4154	f
5157	N20G0	Napoli	Napoli	2026-03-12T15:35:00.000Z	2026-03-12T15:55:00.000Z	tempo accessorio	\N	f
5158	N21G0	Napoli	Napoli	2026-03-12T12:08:00.000Z	2026-03-12T12:38:00.000Z	tempo accessorio	\N	f
5159	N21G0	Napoli	P.Marino	2026-03-12T12:38:00.000Z	2026-03-12T13:42:00.000Z	corsa in linea	413700	f
5160	N21G0	P.Marino	P.Marino	2026-03-12T13:42:00.000Z	2026-03-12T15:42:00.000Z	sosta	\N	f
5161	N21G0	P.Marino	Napoli	2026-03-12T15:42:00.000Z	2026-03-12T16:47:00.000Z	corsa in linea	4166	f
5197	N01G0	Sorrento	Napoli	2026-03-12T19:14:00.000Z	2026-03-12T20:26:00.000Z	corsa in linea	1202	f
5198	N01G0	Napoli	Napoli	2026-03-12T20:26:00.000Z	2026-03-12T20:46:00.000Z	tempo accessorio	\N	f
5128	N21G0	Napoli	Sorrento	2026-03-12T17:17:00.000Z	2026-03-12T18:30:00.000Z	corsa in linea	1183	f
5126	N09G0	Sorrento	Napoli	2026-03-12T15:20:00.000Z	2026-03-12T16:37:00.000Z	corsa in linea	11618	f
5127	N09G0	Napoli	Napoli	2026-03-12T16:37:00.000Z	2026-03-12T17:17:00.000Z	sosta	\N	f
5162	N21G0	Napoli	Napoli	2026-03-12T16:47:00.000Z	2026-03-12T17:07:00.000Z	tempo accessorio	\N	f
5199	N03G0	Napoli	Napoli	2026-03-12T04:52:00.000Z	2026-03-12T05:22:00.000Z	tempo accessorio	\N	f
5200	N03G0	Napoli	Sarno	2026-03-12T05:22:00.000Z	2026-03-12T06:34:00.000Z	corsa in linea	6063	f
5203	N13G0	Napoli	Napoli	2026-03-12T05:01:00.000Z	2026-03-12T05:31:00.000Z	tempo accessorio	\N	f
5204	N13G0	Napoli	Baiano	2026-03-12T05:31:00.000Z	2026-03-12T07:01:00.000Z	corsa in linea	80631	f
5171	N22G0	Sorrento	Napoli	2026-03-12T18:20:00.000Z	2026-03-12T19:37:00.000Z	corsa in linea	11918	f
5172	N22G0	Napoli	Napoli	2026-03-12T19:37:00.000Z	2026-03-12T19:57:00.000Z	tempo accessorio	\N	f
5169	N09G0	Napoli	Sorrento	2026-03-12T13:22:00.000Z	2026-03-12T14:36:00.000Z	corsa in linea	11421	f
5163	N22G0	Sorrento	Sorrento	2026-03-12T11:50:00.000Z	2026-03-12T12:20:00.000Z	tempo accessorio	\N	f
5164	N22G0	Sorrento	Napoli	2026-03-12T12:20:00.000Z	2026-03-12T13:37:00.000Z	corsa in linea	11318	f
5165	N22G0	Napoli	Napoli	2026-03-12T13:37:00.000Z	2026-03-12T16:22:00.000Z	sosta	\N	f
5166	N22G0	Napoli	Sorrento	2026-03-12T16:22:00.000Z	2026-03-12T17:36:00.000Z	corsa in linea	11721	f
5173	N24G0	Napoli	Napoli	2026-03-12T05:28:00.000Z	2026-03-12T05:58:00.000Z	tempo accessorio	\N	f
5174	N24G0	Napoli	Sarno	2026-03-12T05:58:00.000Z	2026-03-12T07:10:00.000Z	corsa in linea	6069	f
5175	N24G0	Sarno	Sarno	2026-03-12T07:10:00.000Z	2026-03-12T08:02:00.000Z	sosta	\N	f
5176	N24G0	Sarno	Napoli	2026-03-12T08:02:00.000Z	2026-03-12T09:15:00.000Z	corsa in linea	6090	f
5177	N24G0	Napoli	Napoli	2026-03-12T09:15:00.000Z	2026-03-12T11:33:00.000Z	sosta	\N	f
5178	N24G0	Napoli	T.Annunziata	2026-03-12T11:33:00.000Z	2026-03-12T12:11:00.000Z	corsa in linea	11233	f
5179	N24G0	T.Annunziata	T.Annunziata	2026-03-12T12:11:00.000Z	2026-03-12T12:21:00.000Z	sosta	\N	f
5180	N24G0	T.Annunziata	Napoli	2026-03-12T12:21:00.000Z	2026-03-12T12:59:00.000Z	corsa in linea	11320	f
5181	N24G0	Napoli	Napoli	2026-03-12T12:59:00.000Z	2026-03-12T13:19:00.000Z	tempo accessorio	\N	f
5182	N25G0	Napoli	Napoli	2026-03-12T18:35:00.000Z	2026-03-12T19:05:00.000Z	tempo accessorio	\N	f
5183	N25G0	Napoli	Sorrento	2026-03-12T19:05:00.000Z	2026-03-12T20:17:00.000Z	corsa in linea	1201	f
5184	N25G0	Sorrento	Sorrento	2026-03-12T20:17:00.000Z	2026-03-12T21:02:00.000Z	sosta	\N	f
5185	N25G0	Sorrento	Napoli	2026-03-12T21:02:00.000Z	2026-03-12T22:13:00.000Z	corsa in linea	12202	f
5186	N25G0	Napoli	Napoli	2026-03-12T22:13:00.000Z	2026-03-12T22:33:00.000Z	tempo accessorio	\N	f
5187	N26G0	Napoli	Napoli	2026-03-12T06:15:00.000Z	2026-03-12T06:45:00.000Z	tempo accessorio	\N	f
5188	N26G0	Napoli	T.Annunziata	2026-03-12T06:45:00.000Z	2026-03-12T07:23:00.000Z	corsa in linea	10745	f
5189	N26G0	T.Annunziata	T.Annunziata	2026-03-12T07:23:00.000Z	2026-03-12T07:33:00.000Z	sosta	\N	f
5190	N26G0	T.Annunziata	Napoli	2026-03-12T07:33:00.000Z	2026-03-12T08:11:00.000Z	corsa in linea	10832	f
5191	N26G0	Napoli	Napoli	2026-03-12T08:11:00.000Z	2026-03-12T08:31:00.000Z	tempo accessorio	\N	f
5201	N04G0	Napoli	Napoli	2026-03-12T04:56:00.000Z	2026-03-12T05:26:00.000Z	tempo accessorio	\N	f
5202	N04G0	Napoli	P.Marino	2026-03-12T05:26:00.000Z	2026-03-12T06:30:00.000Z	corsa in linea	4065	f
5205	N05G0	Napoli	Napoli	2026-03-12T05:23:00.000Z	2026-03-12T05:53:00.000Z	tempo accessorio	\N	f
5206	N05G0	Napoli	Sorrento	2026-03-12T05:53:00.000Z	2026-03-12T07:05:00.000Z	corsa in linea	10653	f
5207	N13G0	Baiano	S.Giorgio	2026-03-12T10:15:00.000Z	2026-03-12T11:23:00.000Z	corsa in linea	8112	f
5208	N13G0	S.Giorgio	S.Giorgio	2026-03-12T11:23:00.000Z	2026-03-12T11:43:00.000Z	tempo accessorio	\N	f
\.


--
-- Data for Name: attivita_snapshot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attivita_snapshot (id, nastro_id, id_punto_origine, id_punto_destinazione, orario_inizio_attivita, orario_fine_attivita, tipo_attivita, id_corsa, is_bridge_corsa) FROM stdin;
1	N00G0	Napoli	Napoli	2026-03-12T11:28:00.000Z	2026-03-12T11:58:00.000Z	tempo accessorio	\N	f
2	N00G0	Napoli	Sarno	2026-03-12T11:58:00.000Z	2026-03-12T13:10:00.000Z	corsa in linea	6129	f
3	N00G0	Sarno	Sarno	2026-03-12T13:10:00.000Z	2026-03-12T14:02:00.000Z	sosta	\N	f
4	N00G0	Sarno	Napoli	2026-03-12T14:02:00.000Z	2026-03-12T15:15:00.000Z	corsa in linea	6150	f
5	N00G0	Napoli	Napoli	2026-03-12T15:15:00.000Z	2026-03-12T15:34:00.000Z	sosta	\N	f
6	N00G0	Napoli	Sarno	2026-03-12T15:34:00.000Z	2026-03-12T16:46:00.000Z	corsa in linea	6165	f
7	N00G0	Sarno	Sarno	2026-03-12T16:46:00.000Z	2026-03-12T17:38:00.000Z	sosta	\N	f
8	N00G0	Sarno	Napoli	2026-03-12T17:38:00.000Z	2026-03-12T18:51:00.000Z	corsa in linea	6186	f
9	N00G0	Napoli	Napoli	2026-03-12T18:51:00.000Z	2026-03-12T19:11:00.000Z	tempo accessorio	\N	f
10	N01G0	Napoli	Napoli	2026-03-12T13:20:00.000Z	2026-03-12T13:50:00.000Z	tempo accessorio	\N	f
11	N01G0	Napoli	P.Marino	2026-03-12T13:50:00.000Z	2026-03-12T14:54:00.000Z	corsa in linea	4149	f
12	N01G0	P.Marino	P.Marino	2026-03-12T14:54:00.000Z	2026-03-12T15:06:00.000Z	sosta	\N	f
13	N01G0	P.Marino	Napoli	2026-03-12T15:06:00.000Z	2026-03-12T16:11:00.000Z	corsa in linea	4160	f
14	N01G0	Napoli	Napoli	2026-03-12T16:11:00.000Z	2026-03-12T16:31:00.000Z	tempo accessorio	\N	f
15	N02G0	Baiano	Baiano	2026-03-12T14:33:00.000Z	2026-03-12T15:03:00.000Z	tempo accessorio	\N	f
16	N02G0	Baiano	S.Giorgio	2026-03-12T15:03:00.000Z	2026-03-12T16:11:00.000Z	corsa in linea	8160	f
17	N02G0	S.Giorgio	S.Giorgio	2026-03-12T16:11:00.000Z	2026-03-12T16:42:00.000Z	sosta	\N	f
18	N02G0	S.Giorgio	Baiano	2026-03-12T16:42:00.000Z	2026-03-12T17:50:00.000Z	corsa in linea	8177	f
19	N02G0	Baiano	Baiano	2026-03-12T17:50:00.000Z	2026-03-12T18:10:00.000Z	tempo accessorio	\N	f
20	N03G0	Sarno	Sarno	2026-03-12T06:56:00.000Z	2026-03-12T07:26:00.000Z	tempo accessorio	\N	f
21	N03G0	Sarno	Napoli	2026-03-12T07:26:00.000Z	2026-03-12T08:39:00.000Z	corsa in linea	6084	f
22	N03G0	Napoli	Napoli	2026-03-12T08:39:00.000Z	2026-03-12T09:34:00.000Z	sosta	\N	f
23	N03G0	Napoli	Sarno	2026-03-12T09:34:00.000Z	2026-03-12T10:46:00.000Z	corsa in linea	6105	f
24	N03G0	Sarno	Sarno	2026-03-12T10:46:00.000Z	2026-03-12T11:06:00.000Z	tempo accessorio	\N	f
25	N04G0	P.Marino	P.Marino	2026-03-12T06:48:00.000Z	2026-03-12T07:18:00.000Z	tempo accessorio	\N	f
26	N04G0	P.Marino	Napoli	2026-03-12T07:18:00.000Z	2026-03-12T08:23:00.000Z	corsa in linea	4082	f
27	N04G0	Napoli	Napoli	2026-03-12T08:23:00.000Z	2026-03-12T10:14:00.000Z	sosta	\N	f
28	N04G0	Napoli	P.Marino	2026-03-12T10:14:00.000Z	2026-03-12T11:18:00.000Z	corsa in linea	4113	f
29	N04G0	P.Marino	P.Marino	2026-03-12T11:18:00.000Z	2026-03-12T11:38:00.000Z	tempo accessorio	\N	f
30	N05G0	Sorrento	Sorrento	2026-03-12T07:20:00.000Z	2026-03-12T07:50:00.000Z	tempo accessorio	\N	f
31	N05G0	Sorrento	Napoli	2026-03-12T07:50:00.000Z	2026-03-12T09:01:00.000Z	corsa in linea	1088	f
32	N05G0	Napoli	Napoli	2026-03-12T09:01:00.000Z	2026-03-12T10:05:00.000Z	sosta	\N	f
33	N05G0	Napoli	Sorrento	2026-03-12T10:05:00.000Z	2026-03-12T11:17:00.000Z	corsa in linea	1111	f
34	N05G0	Sorrento	Sorrento	2026-03-12T11:17:00.000Z	2026-03-12T11:37:00.000Z	tempo accessorio	\N	f
35	N06G0	Baiano	Baiano	2026-03-12T06:09:00.000Z	2026-03-12T06:39:00.000Z	tempo accessorio	\N	f
36	N06G0	Baiano	S.Giorgio	2026-03-12T06:39:00.000Z	2026-03-12T07:47:00.000Z	corsa in linea	8076	f
37	N06G0	S.Giorgio	S.Giorgio	2026-03-12T07:47:00.000Z	2026-03-12T08:18:00.000Z	sosta	\N	f
38	N06G0	S.Giorgio	Baiano	2026-03-12T08:18:00.000Z	2026-03-12T09:26:00.000Z	corsa in linea	8093	f
39	N06G0	Baiano	Baiano	2026-03-12T09:26:00.000Z	2026-03-12T09:46:00.000Z	tempo accessorio	\N	f
40	N07G0	Baiano	Baiano	2026-03-12T09:09:00.000Z	2026-03-12T09:39:00.000Z	tempo accessorio	\N	f
41	N07G0	Baiano	S.Giorgio	2026-03-12T09:39:00.000Z	2026-03-12T10:47:00.000Z	corsa in linea	8106	f
42	N07G0	S.Giorgio	S.Giorgio	2026-03-12T10:47:00.000Z	2026-03-12T13:42:00.000Z	sosta	\N	f
43	N07G0	S.Giorgio	Baiano	2026-03-12T13:42:00.000Z	2026-03-12T14:50:00.000Z	corsa in linea	8147	f
44	N07G0	Baiano	Baiano	2026-03-12T14:50:00.000Z	2026-03-12T15:10:00.000Z	tempo accessorio	\N	f
45	N08G0	Napoli	Napoli	2026-03-12T11:32:00.000Z	2026-03-12T12:02:00.000Z	tempo accessorio	\N	f
46	N08G0	Napoli	P.Marino	2026-03-12T12:02:00.000Z	2026-03-12T13:06:00.000Z	corsa in linea	4131	f
47	N08G0	P.Marino	P.Marino	2026-03-12T13:06:00.000Z	2026-03-12T13:54:00.000Z	sosta	\N	f
48	N08G0	P.Marino	Napoli	2026-03-12T13:54:00.000Z	2026-03-12T14:58:00.000Z	corsa in linea	4148	f
49	N08G0	Napoli	Napoli	2026-03-12T14:58:00.000Z	2026-03-12T15:38:00.000Z	sosta	\N	f
50	N08G0	Napoli	P.Marino	2026-03-12T15:38:00.000Z	2026-03-12T16:42:00.000Z	corsa in linea	4167	f
51	N08G0	P.Marino	P.Marino	2026-03-12T16:42:00.000Z	2026-03-12T17:30:00.000Z	sosta	\N	f
52	N08G0	P.Marino	Napoli	2026-03-12T17:30:00.000Z	2026-03-12T18:35:00.000Z	corsa in linea	4184	f
53	N08G0	Napoli	Napoli	2026-03-12T18:35:00.000Z	2026-03-12T18:55:00.000Z	tempo accessorio	\N	f
54	N09G0	P.Marino	P.Marino	2026-03-12T11:36:00.000Z	2026-03-12T12:06:00.000Z	tempo accessorio	\N	f
55	N09G0	P.Marino	Napoli	2026-03-12T12:06:00.000Z	2026-03-12T13:11:00.000Z	corsa in linea	4130	f
56	N09G0	Napoli	Napoli	2026-03-12T13:11:00.000Z	2026-03-12T16:50:00.000Z	sosta	\N	f
57	N09G0	Napoli	P.Marino	2026-03-12T16:50:00.000Z	2026-03-12T17:52:00.000Z	corsa in linea	417900	f
58	N09G0	P.Marino	P.Marino	2026-03-12T17:52:00.000Z	2026-03-12T18:12:00.000Z	tempo accessorio	\N	f
59	N10G0	Napoli	Napoli	2026-03-12T13:52:00.000Z	2026-03-12T14:22:00.000Z	tempo accessorio	\N	f
60	N10G0	Napoli	Sarno	2026-03-12T14:22:00.000Z	2026-03-12T15:34:00.000Z	corsa in linea	6153	f
61	N10G0	Sarno	Sarno	2026-03-12T15:34:00.000Z	2026-03-12T16:26:00.000Z	sosta	\N	f
62	N10G0	Sarno	Napoli	2026-03-12T16:26:00.000Z	2026-03-12T17:39:00.000Z	corsa in linea	6174	f
63	N10G0	Napoli	Napoli	2026-03-12T17:39:00.000Z	2026-03-12T17:53:00.000Z	sosta	\N	f
64	N10G0	Napoli	Sorrento	2026-03-12T17:53:00.000Z	2026-03-12T19:06:00.000Z	corsa in linea	1189	f
65	N10G0	Sorrento	Sorrento	2026-03-12T19:06:00.000Z	2026-03-12T19:50:00.000Z	sosta	\N	f
66	N10G0	Sorrento	Napoli	2026-03-12T19:50:00.000Z	2026-03-12T21:02:00.000Z	corsa in linea	1208	f
67	N10G0	Napoli	Napoli	2026-03-12T21:02:00.000Z	2026-03-12T21:22:00.000Z	tempo accessorio	\N	f
68	N11G0	Napoli	Napoli	2026-03-12T05:32:00.000Z	2026-03-12T06:02:00.000Z	tempo accessorio	\N	f
69	N11G0	Napoli	P.Marino	2026-03-12T06:02:00.000Z	2026-03-12T07:06:00.000Z	corsa in linea	4071	f
70	N11G0	P.Marino	P.Marino	2026-03-12T07:06:00.000Z	2026-03-12T07:54:00.000Z	sosta	\N	f
71	N11G0	P.Marino	Napoli	2026-03-12T07:54:00.000Z	2026-03-12T08:58:00.000Z	corsa in linea	4088	f
72	N11G0	Napoli	Napoli	2026-03-12T08:58:00.000Z	2026-03-12T10:22:00.000Z	sosta	\N	f
73	N11G0	Napoli	Sorrento	2026-03-12T10:22:00.000Z	2026-03-12T11:36:00.000Z	corsa in linea	11121	f
74	N11G0	Sorrento	Sorrento	2026-03-12T11:36:00.000Z	2026-03-12T12:02:00.000Z	sosta	\N	f
75	N11G0	Sorrento	Napoli	2026-03-12T12:02:00.000Z	2026-03-12T13:14:00.000Z	corsa in linea	1130	f
76	N11G0	Napoli	Napoli	2026-03-12T13:14:00.000Z	2026-03-12T13:34:00.000Z	tempo accessorio	\N	f
77	N12G0	Baiano	Baiano	2026-03-12T11:33:00.000Z	2026-03-12T12:03:00.000Z	tempo accessorio	\N	f
78	N12G0	Baiano	S.Giorgio	2026-03-12T12:03:00.000Z	2026-03-12T13:11:00.000Z	corsa in linea	8130	f
79	N12G0	S.Giorgio	S.Giorgio	2026-03-12T13:11:00.000Z	2026-03-12T17:54:00.000Z	sosta	\N	f
80	N12G0	S.Giorgio	Baiano	2026-03-12T17:54:00.000Z	2026-03-12T19:02:00.000Z	corsa in linea	8189	f
81	N12G0	Baiano	Baiano	2026-03-12T19:02:00.000Z	2026-03-12T19:22:00.000Z	tempo accessorio	\N	f
82	N13G0	Baiano	Baiano	2026-03-12T06:45:00.000Z	2026-03-12T07:15:00.000Z	tempo accessorio	\N	f
83	N13G0	Baiano	S.Giorgio	2026-03-12T07:15:00.000Z	2026-03-12T08:23:00.000Z	corsa in linea	8082	f
84	N13G0	S.Giorgio	S.Giorgio	2026-03-12T08:23:00.000Z	2026-03-12T08:54:00.000Z	sosta	\N	f
85	N13G0	S.Giorgio	Baiano	2026-03-12T08:54:00.000Z	2026-03-12T10:02:00.000Z	corsa in linea	8099	f
86	N13G0	Baiano	Baiano	2026-03-12T10:02:00.000Z	2026-03-12T10:22:00.000Z	tempo accessorio	\N	f
87	N14G0	Napoli	Napoli	2026-03-12T15:40:00.000Z	2026-03-12T16:10:00.000Z	tempo accessorio	\N	f
88	N14G0	Napoli	Sarno	2026-03-12T16:10:00.000Z	2026-03-12T17:22:00.000Z	corsa in linea	6171	f
89	N14G0	Sarno	Sarno	2026-03-12T17:22:00.000Z	2026-03-12T18:14:00.000Z	sosta	\N	f
90	N14G0	Sarno	Napoli	2026-03-12T18:14:00.000Z	2026-03-12T19:27:00.000Z	corsa in linea	6192	f
91	N14G0	Napoli	Napoli	2026-03-12T19:27:00.000Z	2026-03-12T19:47:00.000Z	tempo accessorio	\N	f
92	N15G0	Sarno	Sarno	2026-03-12T11:08:00.000Z	2026-03-12T11:38:00.000Z	tempo accessorio	\N	f
93	N15G0	Sarno	Napoli	2026-03-12T11:38:00.000Z	2026-03-12T12:51:00.000Z	corsa in linea	6126	f
94	N15G0	Napoli	Napoli	2026-03-12T12:51:00.000Z	2026-03-12T13:46:00.000Z	sosta	\N	f
95	N15G0	Napoli	Sarno	2026-03-12T13:46:00.000Z	2026-03-12T14:58:00.000Z	corsa in linea	6147	f
96	N15G0	Sarno	Sarno	2026-03-12T14:58:00.000Z	2026-03-12T15:50:00.000Z	sosta	\N	f
97	N15G0	Sarno	Napoli	2026-03-12T15:50:00.000Z	2026-03-12T17:03:00.000Z	corsa in linea	6168	f
98	N15G0	Napoli	Napoli	2026-03-12T17:03:00.000Z	2026-03-12T17:22:00.000Z	sosta	\N	f
99	N15G0	Napoli	Sarno	2026-03-12T17:22:00.000Z	2026-03-12T18:34:00.000Z	corsa in linea	6183	f
100	N15G0	Sarno	Sarno	2026-03-12T18:34:00.000Z	2026-03-12T18:54:00.000Z	tempo accessorio	\N	f
101	N16G0	Sorrento	Sorrento	2026-03-12T14:50:00.000Z	2026-03-12T15:20:00.000Z	tempo accessorio	\N	f
102	N16G0	Sorrento	Napoli	2026-03-12T15:20:00.000Z	2026-03-12T16:37:00.000Z	corsa in linea	11618	f
103	N16G0	Napoli	Napoli	2026-03-12T16:37:00.000Z	2026-03-12T17:17:00.000Z	sosta	\N	f
104	N16G0	Napoli	Sorrento	2026-03-12T17:17:00.000Z	2026-03-12T18:30:00.000Z	corsa in linea	1183	f
105	N16G0	Sorrento	Sorrento	2026-03-12T18:30:00.000Z	2026-03-12T18:50:00.000Z	tempo accessorio	\N	f
106	N17G0	Napoli	Napoli	2026-03-12T11:59:00.000Z	2026-03-12T12:29:00.000Z	tempo accessorio	\N	f
107	N17G0	Napoli	Sorrento	2026-03-12T12:29:00.000Z	2026-03-12T13:41:00.000Z	corsa in linea	1135	f
108	N17G0	Sorrento	Sorrento	2026-03-12T13:41:00.000Z	2026-03-12T14:26:00.000Z	sosta	\N	f
109	N17G0	Sorrento	Napoli	2026-03-12T14:26:00.000Z	2026-03-12T15:38:00.000Z	corsa in linea	1154	f
110	N17G0	Napoli	Napoli	2026-03-12T15:38:00.000Z	2026-03-12T16:05:00.000Z	sosta	\N	f
111	N17G0	Napoli	Sorrento	2026-03-12T16:05:00.000Z	2026-03-12T17:17:00.000Z	corsa in linea	1171	f
112	N17G0	Sorrento	Sorrento	2026-03-12T17:17:00.000Z	2026-03-12T18:02:00.000Z	sosta	\N	f
113	N17G0	Sorrento	Napoli	2026-03-12T18:02:00.000Z	2026-03-12T19:14:00.000Z	corsa in linea	1190	f
114	N17G0	Napoli	Napoli	2026-03-12T19:14:00.000Z	2026-03-12T19:34:00.000Z	tempo accessorio	\N	f
115	N18G0	Napoli	Napoli	2026-03-12T17:59:00.000Z	2026-03-12T18:29:00.000Z	tempo accessorio	\N	f
116	N18G0	Napoli	Sorrento	2026-03-12T18:29:00.000Z	2026-03-12T19:41:00.000Z	corsa in linea	1195	f
117	N18G0	Sorrento	Sorrento	2026-03-12T19:41:00.000Z	2026-03-12T20:26:00.000Z	sosta	\N	f
118	N18G0	Sorrento	Napoli	2026-03-12T20:26:00.000Z	2026-03-12T21:37:00.000Z	corsa in linea	1214	f
119	N18G0	Napoli	Napoli	2026-03-12T21:37:00.000Z	2026-03-12T21:57:00.000Z	tempo accessorio	\N	f
120	N19G0	Baiano	Baiano	2026-03-12T07:21:00.000Z	2026-03-12T07:51:00.000Z	tempo accessorio	\N	f
121	N19G0	Baiano	S.Giorgio	2026-03-12T07:51:00.000Z	2026-03-12T08:59:00.000Z	corsa in linea	8088	f
122	N19G0	S.Giorgio	S.Giorgio	2026-03-12T08:59:00.000Z	2026-03-12T10:42:00.000Z	sosta	\N	f
123	N19G0	S.Giorgio	Baiano	2026-03-12T10:42:00.000Z	2026-03-12T11:50:00.000Z	corsa in linea	8117	f
124	N19G0	Baiano	Baiano	2026-03-12T11:50:00.000Z	2026-03-12T12:10:00.000Z	tempo accessorio	\N	f
125	N20G0	Napoli	Napoli	2026-03-12T10:27:00.000Z	2026-03-12T10:57:00.000Z	tempo accessorio	\N	f
126	N20G0	Napoli	T.Annunziata	2026-03-12T10:57:00.000Z	2026-03-12T11:35:00.000Z	corsa in linea	11157	f
127	N20G0	T.Annunziata	T.Annunziata	2026-03-12T11:35:00.000Z	2026-03-12T11:45:00.000Z	sosta	\N	f
128	N20G0	T.Annunziata	Napoli	2026-03-12T11:45:00.000Z	2026-03-12T12:23:00.000Z	corsa in linea	11244	f
129	N20G0	Napoli	Napoli	2026-03-12T12:23:00.000Z	2026-03-12T12:38:00.000Z	sosta	\N	f
130	N20G0	Napoli	P.Marino	2026-03-12T12:38:00.000Z	2026-03-12T13:42:00.000Z	corsa in linea	4137	f
131	N20G0	P.Marino	P.Marino	2026-03-12T13:42:00.000Z	2026-03-12T14:30:00.000Z	sosta	\N	f
132	N20G0	P.Marino	Napoli	2026-03-12T14:30:00.000Z	2026-03-12T15:35:00.000Z	corsa in linea	4154	f
133	N20G0	Napoli	Napoli	2026-03-12T15:35:00.000Z	2026-03-12T15:55:00.000Z	tempo accessorio	\N	f
134	N21G0	Napoli	Napoli	2026-03-12T12:08:00.000Z	2026-03-12T12:38:00.000Z	tempo accessorio	\N	f
135	N21G0	Napoli	P.Marino	2026-03-12T12:38:00.000Z	2026-03-12T13:42:00.000Z	corsa in linea	413700	f
136	N21G0	P.Marino	P.Marino	2026-03-12T13:42:00.000Z	2026-03-12T15:42:00.000Z	sosta	\N	f
137	N21G0	P.Marino	Napoli	2026-03-12T15:42:00.000Z	2026-03-12T16:47:00.000Z	corsa in linea	4166	f
138	N21G0	Napoli	Napoli	2026-03-12T16:47:00.000Z	2026-03-12T17:07:00.000Z	tempo accessorio	\N	f
139	N22G0	Sorrento	Sorrento	2026-03-12T11:50:00.000Z	2026-03-12T12:20:00.000Z	tempo accessorio	\N	f
140	N22G0	Sorrento	Napoli	2026-03-12T12:20:00.000Z	2026-03-12T13:37:00.000Z	corsa in linea	11318	f
141	N22G0	Napoli	Napoli	2026-03-12T13:37:00.000Z	2026-03-12T16:22:00.000Z	sosta	\N	f
142	N22G0	Napoli	Sorrento	2026-03-12T16:22:00.000Z	2026-03-12T17:36:00.000Z	corsa in linea	11721	f
143	N22G0	Sorrento	Sorrento	2026-03-12T17:36:00.000Z	2026-03-12T17:56:00.000Z	tempo accessorio	\N	f
144	N23G0	Napoli	Napoli	2026-03-12T12:52:00.000Z	2026-03-12T13:22:00.000Z	tempo accessorio	\N	f
145	N23G0	Napoli	Sorrento	2026-03-12T13:22:00.000Z	2026-03-12T14:36:00.000Z	corsa in linea	11421	f
146	N23G0	Sorrento	Sorrento	2026-03-12T14:36:00.000Z	2026-03-12T18:20:00.000Z	sosta	\N	f
147	N23G0	Sorrento	Napoli	2026-03-12T18:20:00.000Z	2026-03-12T19:37:00.000Z	corsa in linea	11918	f
148	N23G0	Napoli	Napoli	2026-03-12T19:37:00.000Z	2026-03-12T19:57:00.000Z	tempo accessorio	\N	f
149	N24G0	Napoli	Napoli	2026-03-12T05:28:00.000Z	2026-03-12T05:58:00.000Z	tempo accessorio	\N	f
150	N24G0	Napoli	Sarno	2026-03-12T05:58:00.000Z	2026-03-12T07:10:00.000Z	corsa in linea	6069	f
151	N24G0	Sarno	Sarno	2026-03-12T07:10:00.000Z	2026-03-12T08:02:00.000Z	sosta	\N	f
152	N24G0	Sarno	Napoli	2026-03-12T08:02:00.000Z	2026-03-12T09:15:00.000Z	corsa in linea	6090	f
153	N24G0	Napoli	Napoli	2026-03-12T09:15:00.000Z	2026-03-12T11:33:00.000Z	sosta	\N	f
154	N24G0	Napoli	T.Annunziata	2026-03-12T11:33:00.000Z	2026-03-12T12:11:00.000Z	corsa in linea	11233	f
155	N24G0	T.Annunziata	T.Annunziata	2026-03-12T12:11:00.000Z	2026-03-12T12:21:00.000Z	sosta	\N	f
156	N24G0	T.Annunziata	Napoli	2026-03-12T12:21:00.000Z	2026-03-12T12:59:00.000Z	corsa in linea	11320	f
157	N24G0	Napoli	Napoli	2026-03-12T12:59:00.000Z	2026-03-12T13:19:00.000Z	tempo accessorio	\N	f
158	N25G0	Napoli	Napoli	2026-03-12T18:35:00.000Z	2026-03-12T19:05:00.000Z	tempo accessorio	\N	f
159	N25G0	Napoli	Sorrento	2026-03-12T19:05:00.000Z	2026-03-12T20:17:00.000Z	corsa in linea	1201	f
160	N25G0	Sorrento	Sorrento	2026-03-12T20:17:00.000Z	2026-03-12T21:02:00.000Z	sosta	\N	f
161	N25G0	Sorrento	Napoli	2026-03-12T21:02:00.000Z	2026-03-12T22:13:00.000Z	corsa in linea	12202	f
162	N25G0	Napoli	Napoli	2026-03-12T22:13:00.000Z	2026-03-12T22:33:00.000Z	tempo accessorio	\N	f
163	N26G0	Napoli	Napoli	2026-03-12T06:15:00.000Z	2026-03-12T06:45:00.000Z	tempo accessorio	\N	f
164	N26G0	Napoli	T.Annunziata	2026-03-12T06:45:00.000Z	2026-03-12T07:23:00.000Z	corsa in linea	10745	f
165	N26G0	T.Annunziata	T.Annunziata	2026-03-12T07:23:00.000Z	2026-03-12T07:33:00.000Z	sosta	\N	f
166	N26G0	T.Annunziata	Napoli	2026-03-12T07:33:00.000Z	2026-03-12T08:11:00.000Z	corsa in linea	10832	f
167	N26G0	Napoli	Napoli	2026-03-12T08:11:00.000Z	2026-03-12T08:31:00.000Z	tempo accessorio	\N	f
\.


--
-- Data for Name: merge_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.merge_log (id, tipo_operazione, target_nastro_id, source_nastro_id, bridge_corsa_id, eseguite_alle) FROM stdin;
13	insert-corsa	N19G0	80555	80555	2026-03-11T13:01:55.536Z
14	move-attivita	N18G0	N19G0	\N	2026-03-11T13:02:15.010Z
15	move-attivita	N19G0	N18G0	\N	2026-03-11T13:02:18.872Z
16	insert-corsa	N02G0	82016	82016	2026-03-11T13:04:13.215Z
17	insert-corsa	N01G0	1202	1202	2026-03-11T13:04:49.195Z
18	insert-corsa	N03G0	6063	6063	2026-03-11T13:05:49.356Z
19	insert-corsa	N04G0	4065	4065	2026-03-11T13:05:53.951Z
20	insert-corsa	N13G0	80631	80631	2026-03-11T13:05:57.731Z
21	insert-corsa	N05G0	10653	10653	2026-03-11T13:06:00.869Z
22	insert-corsa	N13G0	8112	8112	2026-03-11T13:06:08.016Z
23	insert-corsa	N14G0	4143	4143	2026-03-11T13:06:16.593Z
24	insert-in-sosta	N23G0	N16G0	\N	2026-03-11T13:07:18.981Z
25	move-attivita	N22G0	N23G0	\N	2026-03-11T13:07:37.762Z
26	move-attivita	N22G0	N23G0	\N	2026-03-11T13:07:41.537Z
27	move-attivita	N21G0	N23G0	\N	2026-03-11T13:07:58.530Z
28	move-attivita	N21G0	N23G0	\N	2026-03-11T13:09:04.662Z
29	move-attivita	N22G0	N21G0	\N	2026-03-11T13:09:17.819Z
30	move-attivita	N22G0	N23G0	\N	2026-03-11T13:09:22.001Z
31	insert-in-sosta	N09G0	N23G0	\N	2026-03-11T13:09:54.840Z
\.


--
-- Data for Name: transiti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transiti (id, id_corsa, id_punto, sequenza, orario_arrivo, orario_partenza, salita_discesa_passeggeri) FROM stdin;
1033	1088	Sorrento	1	2026-03-11T07:50:00.000Z	2026-03-11T07:50:00.000Z	1
1034	1088	Napoli	2	2026-03-11T09:01:00.000Z	2026-03-11T09:01:00.000Z	1
1035	1111	Napoli	1	2026-03-11T10:05:00.000Z	2026-03-11T10:05:00.000Z	1
1036	1111	Sorrento	2	2026-03-11T11:17:00.000Z	2026-03-11T11:17:00.000Z	1
1037	1130	Sorrento	1	2026-03-11T12:02:00.000Z	2026-03-11T12:02:00.000Z	1
1038	1130	Napoli	2	2026-03-11T13:14:00.000Z	2026-03-11T13:14:00.000Z	1
1039	1135	Napoli	1	2026-03-11T12:29:00.000Z	2026-03-11T12:29:00.000Z	1
1040	1135	Sorrento	2	2026-03-11T13:41:00.000Z	2026-03-11T13:41:00.000Z	1
1041	1154	Sorrento	1	2026-03-11T14:26:00.000Z	2026-03-11T14:26:00.000Z	1
1042	1154	Napoli	2	2026-03-11T15:38:00.000Z	2026-03-11T15:38:00.000Z	1
1043	1171	Napoli	1	2026-03-11T16:05:00.000Z	2026-03-11T16:05:00.000Z	1
1044	1171	Sorrento	2	2026-03-11T17:17:00.000Z	2026-03-11T17:17:00.000Z	1
1045	1183	Napoli	1	2026-03-11T17:17:00.000Z	2026-03-11T17:17:00.000Z	1
1046	1183	Sorrento	2	2026-03-11T18:29:00.000Z	2026-03-11T18:29:00.000Z	1
1047	1189	Napoli	1	2026-03-11T17:53:00.000Z	2026-03-11T17:53:00.000Z	1
1048	1189	Sorrento	2	2026-03-11T19:05:00.000Z	2026-03-11T19:05:00.000Z	1
1049	1190	Sorrento	1	2026-03-11T18:02:00.000Z	2026-03-11T18:02:00.000Z	1
1050	1190	Napoli	2	2026-03-11T19:14:00.000Z	2026-03-11T19:14:00.000Z	1
1051	1195	Napoli	1	2026-03-11T18:29:00.000Z	2026-03-11T18:29:00.000Z	1
1052	1195	Sorrento	2	2026-03-11T19:41:00.000Z	2026-03-11T19:41:00.000Z	1
1053	1201	Napoli	1	2026-03-11T19:05:00.000Z	2026-03-11T19:05:00.000Z	1
1054	1201	Sorrento	2	2026-03-11T20:17:00.000Z	2026-03-11T20:17:00.000Z	1
1055	1202	Sorrento	1	2026-03-11T19:14:00.000Z	2026-03-11T19:14:00.000Z	1
1056	1202	Napoli	2	2026-03-11T20:26:00.000Z	2026-03-11T20:26:00.000Z	1
1057	1208	Sorrento	1	2026-03-11T19:50:00.000Z	2026-03-11T19:50:00.000Z	1
1058	1208	Napoli	2	2026-03-11T21:02:00.000Z	2026-03-11T21:02:00.000Z	1
1059	1214	Sorrento	1	2026-03-11T20:26:00.000Z	2026-03-11T20:26:00.000Z	1
1060	1214	Napoli	2	2026-03-11T21:37:00.000Z	2026-03-11T21:37:00.000Z	1
1061	4065	Napoli	1	2026-03-11T05:26:00.000Z	2026-03-11T05:26:00.000Z	1
1062	4065	P.Marino	2	2026-03-11T06:30:00.000Z	2026-03-11T06:30:00.000Z	1
1063	4071	Napoli	1	2026-03-11T06:02:00.000Z	2026-03-11T06:02:00.000Z	1
1064	4071	P.Marino	2	2026-03-11T07:06:00.000Z	2026-03-11T07:06:00.000Z	1
1065	4082	P.Marino	1	2026-03-11T07:18:00.000Z	2026-03-11T07:18:00.000Z	1
1066	4082	Napoli	2	2026-03-11T08:22:00.000Z	2026-03-11T08:22:00.000Z	1
1067	4088	P.Marino	1	2026-03-11T07:54:00.000Z	2026-03-11T07:54:00.000Z	1
1068	4088	Napoli	2	2026-03-11T08:58:00.000Z	2026-03-11T08:58:00.000Z	1
1069	4113	Napoli	1	2026-03-11T10:14:00.000Z	2026-03-11T10:14:00.000Z	1
1070	4113	P.Marino	2	2026-03-11T11:18:00.000Z	2026-03-11T11:18:00.000Z	1
1071	4130	P.Marino	1	2026-03-11T12:06:00.000Z	2026-03-11T12:06:00.000Z	1
1072	4130	Napoli	2	2026-03-11T13:10:00.000Z	2026-03-11T13:10:00.000Z	1
1073	4131	Napoli	1	2026-03-11T12:02:00.000Z	2026-03-11T12:02:00.000Z	1
1074	4131	P.Marino	2	2026-03-11T13:06:00.000Z	2026-03-11T13:06:00.000Z	1
1075	4137	Napoli	1	2026-03-11T12:38:00.000Z	2026-03-11T12:38:00.000Z	1
1076	4137	P.Marino	2	2026-03-11T13:42:00.000Z	2026-03-11T13:42:00.000Z	1
1077	4143	Napoli	1	2026-03-11T13:14:00.000Z	2026-03-11T13:14:00.000Z	1
1078	4143	P.Marino	2	2026-03-11T14:18:00.000Z	2026-03-11T14:18:00.000Z	1
1079	4148	P.Marino	1	2026-03-11T13:54:00.000Z	2026-03-11T13:54:00.000Z	1
1080	4148	Napoli	2	2026-03-11T14:58:00.000Z	2026-03-11T14:58:00.000Z	1
1081	4149	Napoli	1	2026-03-11T13:50:00.000Z	2026-03-11T13:50:00.000Z	1
1082	4149	P.Marino	2	2026-03-11T14:54:00.000Z	2026-03-11T14:54:00.000Z	1
1083	4154	P.Marino	1	2026-03-11T14:30:00.000Z	2026-03-11T14:30:00.000Z	1
1084	4154	Napoli	2	2026-03-11T15:34:00.000Z	2026-03-11T15:34:00.000Z	1
1085	4160	P.Marino	1	2026-03-11T15:06:00.000Z	2026-03-11T15:06:00.000Z	1
1086	4160	Napoli	2	2026-03-11T16:10:00.000Z	2026-03-11T16:10:00.000Z	1
1087	4166	P.Marino	1	2026-03-11T15:42:00.000Z	2026-03-11T15:42:00.000Z	1
1088	4166	Napoli	2	2026-03-11T16:46:00.000Z	2026-03-11T16:46:00.000Z	1
1089	4167	Napoli	1	2026-03-11T15:38:00.000Z	2026-03-11T15:38:00.000Z	1
1090	4167	P.Marino	2	2026-03-11T16:42:00.000Z	2026-03-11T16:42:00.000Z	1
1091	4184	P.Marino	1	2026-03-11T17:30:00.000Z	2026-03-11T17:30:00.000Z	1
1092	4184	Napoli	2	2026-03-11T18:34:00.000Z	2026-03-11T18:34:00.000Z	1
1093	6063	Napoli	1	2026-03-11T05:22:00.000Z	2026-03-11T05:22:00.000Z	1
1094	6063	Sarno	2	2026-03-11T06:34:00.000Z	2026-03-11T06:34:00.000Z	1
1095	6069	Napoli	1	2026-03-11T05:58:00.000Z	2026-03-11T05:58:00.000Z	1
1096	6069	Sarno	2	2026-03-11T07:10:00.000Z	2026-03-11T07:10:00.000Z	1
1097	6084	Sarno	1	2026-03-11T07:26:00.000Z	2026-03-11T07:26:00.000Z	1
1098	6084	Napoli	2	2026-03-11T08:39:00.000Z	2026-03-11T08:39:00.000Z	1
1099	6090	Sarno	1	2026-03-11T08:02:00.000Z	2026-03-11T08:02:00.000Z	1
1100	6090	Napoli	2	2026-03-11T09:15:00.000Z	2026-03-11T09:15:00.000Z	1
1101	6105	Napoli	1	2026-03-11T09:34:00.000Z	2026-03-11T09:34:00.000Z	1
1102	6105	Sarno	2	2026-03-11T10:46:00.000Z	2026-03-11T10:46:00.000Z	1
1103	6126	Sarno	1	2026-03-11T11:38:00.000Z	2026-03-11T11:38:00.000Z	1
1104	6126	Napoli	2	2026-03-11T12:51:00.000Z	2026-03-11T12:51:00.000Z	1
1105	6129	Napoli	1	2026-03-11T11:58:00.000Z	2026-03-11T11:58:00.000Z	1
1106	6129	Sarno	2	2026-03-11T13:10:00.000Z	2026-03-11T13:10:00.000Z	1
1107	6147	Napoli	1	2026-03-11T13:46:00.000Z	2026-03-11T13:46:00.000Z	1
1108	6147	Sarno	2	2026-03-11T14:58:00.000Z	2026-03-11T14:58:00.000Z	1
1109	6150	Sarno	1	2026-03-11T14:02:00.000Z	2026-03-11T14:02:00.000Z	1
1110	6150	Napoli	2	2026-03-11T15:15:00.000Z	2026-03-11T15:15:00.000Z	1
1111	6153	Napoli	1	2026-03-11T14:22:00.000Z	2026-03-11T14:22:00.000Z	1
1112	6153	Sarno	2	2026-03-11T15:34:00.000Z	2026-03-11T15:34:00.000Z	1
1113	6165	Napoli	1	2026-03-11T15:34:00.000Z	2026-03-11T15:34:00.000Z	1
1114	6165	Sarno	2	2026-03-11T16:46:00.000Z	2026-03-11T16:46:00.000Z	1
1115	6168	Sarno	1	2026-03-11T15:50:00.000Z	2026-03-11T15:50:00.000Z	1
1116	6168	Napoli	2	2026-03-11T17:03:00.000Z	2026-03-11T17:03:00.000Z	1
1117	6171	Napoli	1	2026-03-11T16:10:00.000Z	2026-03-11T16:10:00.000Z	1
1118	6171	Sarno	2	2026-03-11T17:22:00.000Z	2026-03-11T17:22:00.000Z	1
1119	6174	Sarno	1	2026-03-11T16:26:00.000Z	2026-03-11T16:26:00.000Z	1
1120	6174	Napoli	2	2026-03-11T17:39:00.000Z	2026-03-11T17:39:00.000Z	1
1121	6183	Napoli	1	2026-03-11T17:22:00.000Z	2026-03-11T17:22:00.000Z	1
1122	6183	Sarno	2	2026-03-11T18:34:00.000Z	2026-03-11T18:34:00.000Z	1
1123	6186	Sarno	1	2026-03-11T17:38:00.000Z	2026-03-11T17:38:00.000Z	1
1124	6186	Napoli	2	2026-03-11T18:51:00.000Z	2026-03-11T18:51:00.000Z	1
1125	6192	Sarno	1	2026-03-11T18:14:00.000Z	2026-03-11T18:14:00.000Z	1
1126	6192	Napoli	2	2026-03-11T19:27:00.000Z	2026-03-11T19:27:00.000Z	1
1127	8076	Baiano	1	2026-03-11T06:39:00.000Z	2026-03-11T06:39:00.000Z	1
1128	8076	S.Giorgio	2	2026-03-11T07:47:00.000Z	2026-03-11T07:47:00.000Z	1
1129	8082	Baiano	1	2026-03-11T07:15:00.000Z	2026-03-11T07:15:00.000Z	1
1130	8082	S.Giorgio	2	2026-03-11T08:23:00.000Z	2026-03-11T08:23:00.000Z	1
1131	8088	Baiano	1	2026-03-11T07:51:00.000Z	2026-03-11T07:51:00.000Z	1
1132	8088	S.Giorgio	2	2026-03-11T08:59:00.000Z	2026-03-11T08:59:00.000Z	1
1133	8093	S.Giorgio	1	2026-03-11T08:18:00.000Z	2026-03-11T08:18:00.000Z	1
1134	8093	Baiano	2	2026-03-11T09:26:00.000Z	2026-03-11T09:26:00.000Z	1
1135	8099	S.Giorgio	1	2026-03-11T08:54:00.000Z	2026-03-11T08:54:00.000Z	1
1136	8099	Baiano	2	2026-03-11T10:02:00.000Z	2026-03-11T10:02:00.000Z	1
1137	8106	Baiano	1	2026-03-11T09:39:00.000Z	2026-03-11T09:39:00.000Z	1
1138	8106	S.Giorgio	2	2026-03-11T10:47:00.000Z	2026-03-11T10:47:00.000Z	1
1139	8112	Baiano	1	2026-03-11T10:15:00.000Z	2026-03-11T10:15:00.000Z	1
1140	8112	S.Giorgio	2	2026-03-11T11:23:00.000Z	2026-03-11T11:23:00.000Z	1
1141	8117	S.Giorgio	1	2026-03-11T10:42:00.000Z	2026-03-11T10:42:00.000Z	1
1142	8117	Baiano	2	2026-03-11T11:50:00.000Z	2026-03-11T11:50:00.000Z	1
1143	8130	Baiano	1	2026-03-11T12:03:00.000Z	2026-03-11T12:03:00.000Z	1
1144	8130	S.Giorgio	2	2026-03-11T13:11:00.000Z	2026-03-11T13:11:00.000Z	1
1145	8147	S.Giorgio	1	2026-03-11T13:42:00.000Z	2026-03-11T13:42:00.000Z	1
1146	8147	Baiano	2	2026-03-11T14:50:00.000Z	2026-03-11T14:50:00.000Z	1
1147	8160	Baiano	1	2026-03-11T15:03:00.000Z	2026-03-11T15:03:00.000Z	1
1148	8160	S.Giorgio	2	2026-03-11T16:11:00.000Z	2026-03-11T16:11:00.000Z	1
1149	8177	S.Giorgio	1	2026-03-11T16:42:00.000Z	2026-03-11T16:42:00.000Z	1
1150	8177	Baiano	2	2026-03-11T17:50:00.000Z	2026-03-11T17:50:00.000Z	1
1151	8189	S.Giorgio	1	2026-03-11T17:54:00.000Z	2026-03-11T17:54:00.000Z	1
1152	8189	Baiano	2	2026-03-11T19:02:00.000Z	2026-03-11T19:02:00.000Z	1
1153	10653	Napoli	1	2026-03-11T05:53:00.000Z	2026-03-11T05:53:00.000Z	1
1154	10653	Sorrento	2	2026-03-11T07:05:00.000Z	2026-03-11T07:05:00.000Z	1
1155	10745	Napoli	1	2026-03-11T06:45:00.000Z	2026-03-11T06:45:00.000Z	1
1156	10745	T.Annunziata	2	2026-03-11T07:23:00.000Z	2026-03-11T07:23:00.000Z	1
1157	10832	T.Annunziata	1	2026-03-11T07:33:00.000Z	2026-03-11T07:33:00.000Z	1
1158	10832	Napoli	2	2026-03-11T08:11:00.000Z	2026-03-11T08:11:00.000Z	1
1159	11121	Napoli	1	2026-03-11T10:22:00.000Z	2026-03-11T10:22:00.000Z	1
1160	11121	Sorrento	2	2026-03-11T11:35:00.000Z	2026-03-11T11:35:00.000Z	1
1161	11157	Napoli	1	2026-03-11T10:57:00.000Z	2026-03-11T10:57:00.000Z	1
1162	11157	T.Annunziata	2	2026-03-11T11:35:00.000Z	2026-03-11T11:35:00.000Z	1
1163	11233	Napoli	1	2026-03-11T11:33:00.000Z	2026-03-11T11:33:00.000Z	1
1164	11233	T.Annunziata	2	2026-03-11T12:11:00.000Z	2026-03-11T12:11:00.000Z	1
1165	11244	T.Annunziata	1	2026-03-11T11:45:00.000Z	2026-03-11T11:45:00.000Z	1
1166	11244	Napoli	2	2026-03-11T12:23:00.000Z	2026-03-11T12:23:00.000Z	1
1167	11318	Sorrento	1	2026-03-11T12:20:00.000Z	2026-03-11T12:20:00.000Z	1
1168	11318	Napoli	2	2026-03-11T13:37:00.000Z	2026-03-11T13:37:00.000Z	1
1169	11320	T.Annunziata	1	2026-03-11T12:21:00.000Z	2026-03-11T12:21:00.000Z	1
1170	11320	Napoli	2	2026-03-11T12:59:00.000Z	2026-03-11T12:59:00.000Z	1
1171	11320	T.Annunziata	1	2026-03-11T12:21:00.000Z	2026-03-11T12:21:00.000Z	1
1172	11320	Napoli	2	2026-03-11T12:59:00.000Z	2026-03-11T12:59:00.000Z	1
1173	11421	Napoli	1	2026-03-11T13:22:00.000Z	2026-03-11T13:22:00.000Z	1
1174	11421	Sorrento	2	2026-03-11T14:35:00.000Z	2026-03-11T14:35:00.000Z	1
1175	11618	Sorrento	1	2026-03-11T15:20:00.000Z	2026-03-11T15:20:00.000Z	1
1176	11618	Napoli	2	2026-03-11T16:37:00.000Z	2026-03-11T16:37:00.000Z	1
1177	11721	Napoli	1	2026-03-11T16:22:00.000Z	2026-03-11T16:22:00.000Z	1
1178	11721	Sorrento	2	2026-03-11T17:35:00.000Z	2026-03-11T17:35:00.000Z	1
1179	11918	Sorrento	1	2026-03-11T18:20:00.000Z	2026-03-11T18:20:00.000Z	1
1180	11918	Napoli	2	2026-03-11T19:37:00.000Z	2026-03-11T19:37:00.000Z	1
1181	12202	Sorrento	1	2026-03-11T21:02:00.000Z	2026-03-11T21:02:00.000Z	1
1182	12202	Napoli	2	2026-03-11T22:13:00.000Z	2026-03-11T22:13:00.000Z	1
1183	61958	Sarno	1	2026-03-11T18:59:00.000Z	2026-03-11T18:59:00.000Z	1
1184	61958	Napoli	2	2026-03-11T20:22:00.000Z	2026-03-11T20:22:00.000Z	1
1185	80555	Napoli	1	2026-03-11T04:55:00.000Z	2026-03-11T04:55:00.000Z	1
1186	80555	Baiano	2	2026-03-11T06:25:00.000Z	2026-03-11T06:25:00.000Z	1
1187	80631	Napoli	1	2026-03-11T05:31:00.000Z	2026-03-11T05:31:00.000Z	1
1188	80631	Baiano	2	2026-03-11T07:01:00.000Z	2026-03-11T07:01:00.000Z	1
1189	80707	Napoli	1	2026-03-11T06:07:00.000Z	2026-03-11T06:07:00.000Z	1
1190	80707	Baiano	2	2026-03-11T07:37:00.000Z	2026-03-11T07:37:00.000Z	1
1191	81902	Baiano	1	2026-03-11T18:03:00.000Z	2026-03-11T18:03:00.000Z	1
1192	81902	Napoli	2	2026-03-11T19:30:00.000Z	2026-03-11T19:30:00.000Z	1
1193	82016	Baiano	1	2026-03-11T19:17:00.000Z	2026-03-11T19:17:00.000Z	1
1194	82016	Napoli	2	2026-03-11T20:39:00.000Z	2026-03-11T20:39:00.000Z	1
1195	413700	Napoli	1	2026-03-11T12:38:00.000Z	2026-03-11T12:38:00.000Z	1
1196	413700	P.Marino	2	2026-03-11T13:42:00.000Z	2026-03-11T13:42:00.000Z	1
1197	417900	Napoli	1	2026-03-11T16:50:00.000Z	2026-03-11T16:50:00.000Z	1
1198	417900	P.Marino	2	2026-03-11T17:52:00.000Z	2026-03-11T17:52:00.000Z	1
1199	1113200	T.Annunziata	1	2026-03-11T10:33:00.000Z	2026-03-11T10:33:00.000Z	1
1200	1113200	Napoli	2	2026-03-11T11:11:00.000Z	2026-03-11T11:11:00.000Z	1
1201	1120800	T.Annunziata	1	2026-03-11T11:09:00.000Z	2026-03-11T11:09:00.000Z	1
1202	1120800	Napoli	2	2026-03-11T12:11:00.000Z	2026-03-11T12:11:00.000Z	1
1203	1135600	T.Annunziata	1	2026-03-11T12:57:00.000Z	2026-03-11T12:57:00.000Z	1
1204	1135600	Napoli	2	2026-03-11T13:35:00.000Z	2026-03-11T13:35:00.000Z	1
\.


--
-- Name: attivita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attivita_id_seq', 5211, true);


--
-- Name: attivita_snapshot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attivita_snapshot_id_seq', 167, true);


--
-- Name: merge_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.merge_log_id_seq', 31, true);


--
-- Name: transiti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transiti_id_seq', 1204, true);


--
-- Name: attivita attivita_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attivita
    ADD CONSTRAINT attivita_pkey PRIMARY KEY (id);


--
-- Name: attivita_snapshot attivita_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attivita_snapshot
    ADD CONSTRAINT attivita_snapshot_pkey PRIMARY KEY (id);


--
-- Name: merge_log merge_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_log
    ADD CONSTRAINT merge_log_pkey PRIMARY KEY (id);


--
-- Name: transiti transiti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transiti
    ADD CONSTRAINT transiti_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict nQksirhxDzkssSHoLZvDVtETh2SHPOtbTprTRiKctMOC8fnb6L0o7wKa5nGmyi2

