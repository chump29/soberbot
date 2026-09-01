# ![SoberBot](./utils/images/soberbot.webp) SoberBot

> - SoberBot for Discord

---

![Bun](https://img.shields.io/badge/Bun-$_bun-informational?style=plastic&logo=bun "Bun") &nbsp;
![discord.js](https://img.shields.io/badge/discord.js-$_discord-informational?style=plastic&logo=discord.js "discord.js") &nbsp;
![Drizzle](https://img.shields.io/badge/Drizzle-$_drizzle-informational?style=plastic&logo=drizzle "Drizzle")
![SQLite](https://img.shields.io/badge/SQLite-$_sqlite-informational?style=plastic&logo=sqlite "SQLite")

![CodeQL](https://github.com/$_user/$_repo/workflows/CodeQL/badge.svg "CodeQL") &nbsp;
![Coverage](https://img.shields.io/badge/Coverage-$_coverage%25-success?style=plastic&logo=jest "Coverage")

![NO AI](https://img.shields.io/badge/NO-AI-orange?style=plastic "NO AI") &nbsp;
![License](https://img.shields.io/github/license/$_user/$_repo?style=plastic&color=blueviolet&label=License&logo=gplv3 "GPLv3")

---

### What it does: <!-- markdownlint-disable-line MD001 -->

- Tracks sobriety dates

---

### 🔗 Invite Link

[Add SoberBot](https://discord.com/oauth2/authorize?client_id=1523517133835866162&permissions=83968&integration_type=0&scope=bot)

---

### 🖥️ Discord

#### Role Permissions:

|   ⚙️ Permission    |
|:------------------:|
|     EmbedLinks     |
| ReadMessageHistory |
|    SendMessages    |

#### Commands:

|    📋 Task     |        🔧 Command        | ⚙️ Permission |
|:--------------:|:------------------------:|:-------------:|
| List All Dates |          `/all`          | Administrator |
|  Delete Date   |  `/delete <name\|all>`   | SendMessages  |
|      Info      |         `/info`          | SendMessages  |
|   List Dates   |         `/list`          | SendMessages  |
|      Ping      |         `/ping`          | SendMessages  |
|   Reset Date   |     `/reset <name>`      | SendMessages  |
|    Set Date    | `/set YYYY-MM-DD <name>` | SendMessages  |
|  Show Streak   |  `/streak <name\|all>`   | SendMessages  |

---

### 🖧 Docker

#### Environment Variables:

| 📝 Description | 📌 Variable |  {...} Value   |
|:--------------:|:-----------:|:--------------:|
|   Channel ID   | CHANNEL_ID  |      [id]      |
|  Embed Color   |    COLOR    |    #78866b     |
|    DB Name     |   DB_NAME   |  soberbot.db   |
|    DB Path     |   DB_PATH   |      ./db      |
|     Debug      |    DEBUG    | true/**false** |
|    Logo URL    |  LOGO_URL   |     [url]      |
|    Bot Name    |    NAME     |    SoberBot    |
|   Bot Token    |    TOKEN    |    [token]     |

##### From `@postfmly/logoserver`:

|  📝 Description   | 📌 Variable |    {...} Value    |
|:-----------------:|:-----------:|:-----------------:|
|     IPv4/IPv6     |  LOGO_IPv6  |  true/**false**   |
|     Logo Name     |  LOGO_NAME  |   soberbot.webp   |
|    Local Path     |  LOGO_PATH  |  ./utils/images   |
|       Port        |  LOGO_PORT  | **Random**/[port] |
|    Logo 2 Name    | LOGO2_NAME  |    [filename]     |
| Logo 2 Local Path | LOGO2_PATH  |      [path]       |

##### From `@postfmly/checkrate`:

| 📝 Description | 📌 Variable | {...} Value |
|:--------------:|:-----------:|:-----------:|
|   Rate Limit   |    RATE     |     1s      |

#### Deployment:

|  📜 Script  |  🔧 Command   |
|:-----------:|:-------------:|
|    Full     | `./build.sh`  |
| Docker Only | `./docker.sh` |

---

### 📄 Documentation

### Generate:

```bash
./docs.sh
```

---

### 🛰️ Git & CI/CD

- **Pre-Commit:** Staged files are automatically linted
- **Github Actions:** Builds and pushes images to repository
  - latest
    - amd64
    - arm64
