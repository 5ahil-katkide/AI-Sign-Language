from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.responses import RedirectResponse

from api.feedback import router as feedback_router
from api.practice import router as practice_router
from api.dashboard import router as dashboard_router
from api.predict import router as predict_router
from api.auth import router as auth_router
from api.profile import router as profile_router

from database.database import engine
from database.models import Base


# =========================================================
# PROJECT ROOT
# =========================================================

ROOT_DIR = Path(__file__).resolve().parent


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="AI Sign Language Recognition"
)


# =========================================================
# STATIC
# =========================================================

app.mount(
    "/static",
    StaticFiles(
        directory=str(
            ROOT_DIR / "static"
        )
    ),
    name="static"
)


# =========================================================
# TEMPLATES
# =========================================================

templates = Jinja2Templates(
    directory=str(
        ROOT_DIR / "templates"
    )
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    auth_router
)

app.include_router(
    predict_router
)

app.include_router(
    feedback_router
)

app.include_router(
    practice_router
)

app.include_router(
    dashboard_router
)

app.include_router(
    profile_router
)


# =========================================================
# HOME
# =========================================================
# =========================================================
# HOME
# =========================================================

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(
        url="/login",
        status_code=302
    )


# =========================================================
# LOGIN
# =========================================================

@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html"
    )



# ====================================================
# REGISTER
# =========================================================

@app.get(
    "/register",
    response_class=HTMLResponse
)
async def register_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="register.html"
    )


# =========================================================
# PRACTICE
# =========================================================

@app.get(
    "/practice",
    response_class=HTMLResponse
)
async def practice_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="practice.html"
    )


# =========================================================
# DASHBOARD
# =========================================================

@app.get(
    "/dashboard",
    response_class=HTMLResponse
)
async def dashboard_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html"
    )


# =========================================================
# PROFILE
# =========================================================

@app.get(
    "/profile",
    response_class=HTMLResponse
)
async def profile_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="profile.html"
    )


# =========================================================
# COURSES
# =========================================================

@app.get(
    "/courses",
    response_class=HTMLResponse
)
async def courses_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="courses.html"
    )

# =========================================================
# CERTIFICATE
# =========================================================

@app.get(
    "/certificate.html",
    response_class=HTMLResponse
)
async def certificate_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="certificate.html"
    )