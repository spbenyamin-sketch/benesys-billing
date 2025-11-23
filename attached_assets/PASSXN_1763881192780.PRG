Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()

set curs on
#region  1

cho = 0
cond = .t.
post = .t.
set cons off

DEFI WIND pass  FROM 10,25 TO 14,55;
	  colo +W/GR+ double SHAD  IN WINDOW Form1 FONT 'CONSOLAS',14 STYLE "B"
	acti WIND pass 
	do while cond and cho<=2  
		cho = cho + 1
		store spac(10) to login,pass
		@ 1,16 fill to 1,22 colo n+/n+			
		@ 1,2 SAY "Login Key   :" colo w+/gR+
		@ 1,16 get pass colo b/b,b/b,b/b,b/b ;
			defa "       " SIZE 1,7 VALI !EMPT(PASS)
		read
		if last()=27
			rele wind pass
			QUIT
			canc
		endi			

	IF !USED("PASS")
		SELECT 0
		USE PASS
	ENDIF 
	SELECT PASS
	GO TOP
	LOCATE FOR ALLTRIM(NAME)=UPPER(ALLTRIM(PASS))
	IF FOUND()
		TAGCODE=PASS.CODE
		supp=pass.sup
		SELECT PASS
		USE 
		cond = .F.
	ELSE 
		WAIT WINDOW "PASSWORD MISMATCH" NOWAIT 
		SELECT PASS
		USE 
	ENDIF
endd
set message wind
set cons on
rele wind pass,INITWIN

if cond
	set curs off
	deac popu all
	rele popu all
	deac wind all
	rele wind all	
else

	retu .t.
endi
retu .f.

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "LOGIN PAGE"
FontName = 'Consolas'
FontSize = 15
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE
