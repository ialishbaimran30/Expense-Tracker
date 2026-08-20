from django.shortcuts import render,redirect,get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Task,Category,Tag,Notification
from .forms import TaskForm
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import Taskserializer,CategorySerializer,TagSerializer,NotificationSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework.routers import DefaultRouter
from rest_framework import viewsets
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
# Create your views here.
@login_required
def add_task(request):
    if  request.method == "POST":
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save(commit= False)
            task.user = request.user
            task.save()
            form.save_m2m()
            return redirect("dashboard")
    else:
        form = TaskForm()
        return render(request,"tasks/add_task.html",{"form":form})
    
@login_required
def task_list(request):
     
    search=request.GET.get("search")
    status =request.GET.get("status")
    priority=request.GET.get("priority")
    category = request.GET.get("category")

    tasks= Task.objects.filter(user=request.user)
    if search:
        tasks=tasks.filter(title__icontains=search)
    if status:
        tasks=tasks.filter(status=status)
    if priority:
        tasks = tasks.filter(priority=priority)

    if category:
        tasks = tasks.filter(category_id=category)
    categories= Category.objects.all()
    return render(request,"tasks/task_list.html",{"tasks":tasks,"categories":categories})
    

@login_required
def edit_task(request,id):
    task =get_object_or_404(Task, id=id,user=request.user)
    if request.method== "POST":
        form = TaskForm(request.POST,instance =task)
        if form.is_valid():
            form.save()

            return redirect("task_list")
    
    else:
        form = TaskForm(instance=task)
    return render(request,"tasks/add_task.html",{"form":form})
@login_required
def delete_task(request,id):
    task =get_object_or_404(Task,id=id,user = request.user)
    task.delete()
    return redirect("task_list")

class TaskViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = Taskserializer
    permission_classes=[IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def start_timer(self, request, pk=None):
        task = self.get_object()
        task.timer_started_at = timezone.now()
        task.save()
        return Response(Taskserializer(task).data)

   


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)
 
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"status": "ok"})


