from rest_framework import serializers
from .models import Task,Category,Tag,Notification
from django.contrib.auth.models import User

class Taskserializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    elapsed_minutes = serializers.SerializerMethodField()
    class Meta:
        model = Task
        fields= ["id", "user", "title", "description", "due_date","priority", "status", "category", "tags", "create_at","progress", "elapsed_minutes",]
        read_only_fields=["user","create_at"]

    def get_progress(self, obj):
        return {"Pending": 0, "In Progress": 50, "Completed": 100}.get(obj.status, 0)
 
    

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields=["user"]

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"
        read_only_fields=["user"]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["user"]

# class RegisterSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = ["username", "email", "password", "password2"]
#         extra_kwargs = {
#             "password": {"write_only": True},
#             "email": {"required": True},
#         }

#     def validate(self, data):
#         if data["password"] != data["password2"]:
#             raise serializers.ValidationError({"password2": "Passwords do not match."})
#         if User.objects.filter(email=data["email"]).exists():
#             raise serializers.ValidationError({"email": "This email is already registered."})
#         if User.objects.filter(username=data["username"]).exists():
#             raise serializers.ValidationError({"username": "This username is already taken."})
#         return data

#     def create(self, validated_data):
#         validated_data.pop("password2")
#         user = User.objects.create_user(
#             username=validated_data["username"],
#             email=validated_data["email"],
#             password=validated_data["password"],
#         )
#         return user